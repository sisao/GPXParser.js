type Metadata = {
    name: string;
    desc: string;
    time: string;
    author: Author;
    link: Link;
}

type Author = {
    name: string;
    email: Email;
    link: Link;
}

type Link = {
    href: string | null;
    text: string;
    type: string;
}

type Email = {
    id: string | null;
    domain: string | null;
}

type Waypoint = {
    name: string;
    cmt: string;
    desc: string;
    lon: number;
    lat: number;
    ele: number;
}

type DistanceElement = {
    total: number;
    cumul: number[];
}

type ElevationElement = {
    max: number;
    min: number;
    pos: number;
    neg: number;
    avg: number;
    abs: number;
    slope: number;
}

type Track = {
    name: string;
    cmt: string;
    desc: string;
    src: string;
    number: string;
    route: string;
    link: Link;
    distance: DistanceElement;
    elevation: ElevationElement;
    points: Point[];
    type: string;
}

type Route = {
    name: string;
    cmt: string;
    desc: string;
    src: string;
    number: string;
    route: string;
    link: Link;
    type: string;
    distance: DistanceElement;
    elevation: ElevationElement;
    points: Point[];
}

type SectionElement = {
    distance: DistanceElement,
    elevation: ElevationElement,
}

type Config = {
    calculateSections: boolean;
    sectionLength: number;
}

type Point = {
    name: string;
    lat: number;
    lon: number;
    ele: number;
    cmt: string;
    desc: string;
}

type GeoJSON = {
    type: string,
    features: Feature[],
    properties: {
        name: string,
        desc: string,
        time: string,
        author: Author,
        link: Link,
    }
};

type Feature = {
    type: string,
    geometry: {
        type: string,
        coordinates: (number[] | number)[]
    },
    properties: {
        name: string,
        cmt: string,
        desc: string,
        src: string,
        number: string,
        link: Link,
        type: string,
    }
};

interface IGpxParser {
    parse(gpxstring: string, options: Config): void;
    getElementValue(parent: Element, needle: string): string | null;
    queryDirectSelector(parent: Element, needle: string): Element;
    calculDistance(points: Point[]): DistanceElement;
    calcElevation(points: Point[]): ElevationElement;
    calcDistanceBetween(wpt1: Point, wpt2: Point): number;
    calcSections(points: Point[], sectionLength: number): SectionElement[];
    toGeoJSON(): GeoJSON;
}

class GpxParser implements IGpxParser {
    xmlSource: XMLDocument;
    metadata: Metadata;
    waypoints: Waypoint[];
    tracks: Track[];
    routes: Route[];
    sections: SectionElement[][];
    config: Config;

    /**
     * GPX file parser
     *
     * @constructor
     */
    constructor() {
        this.xmlSource = new Document();
        this.metadata = {} as Metadata;
        this.waypoints = [];
        this.tracks = [];
        this.routes = [];
        this.sections = [];
        this.config = {} as Config;
    }

    /**
     * Parse a gpx formatted string to a GPXParser Object
     *
     * @param {string} gpxstring - A GPX formatted String
     *
     * @param {Options} options (optional) - A options object
     *
     * @return {} A GPXParser object
     */
    parse(gpxstring: string, options: Config): void {
        const defaultParameters = {
            calculateSections: false,
            sectionLength: 100,
            precision: 17,
        };
        this.config = Object.assign({}, defaultParameters, options);

        const keepThis = this;
        const domParser = new window.DOMParser();
        this.xmlSource = domParser.parseFromString(gpxstring, 'text/xml');
        const parsedMetadata = this.xmlSource.querySelector<Element>('metadata');
        if (parsedMetadata != null) {
            this.metadata.name = this.getElementValue(parsedMetadata, "name") || "";
            this.metadata.desc = this.getElementValue(parsedMetadata, "desc") || "";
            this.metadata.time = this.getElementValue(parsedMetadata, "time") || "";

            const author = {} as Author;
            const authorElem = parsedMetadata.querySelector('author');
            if (authorElem != null) {
                author.name = this.getElementValue(authorElem, "name") || "";
                author.email = {} as Email;
                const emailElem = authorElem.querySelector('email');
                if (emailElem != null) {
                    author.email.id = emailElem.getAttribute("id");
                    author.email.domain = emailElem.getAttribute("domain");
                }

                const authorLink = {} as Link;
                const authorLinkElem = authorElem.querySelector('link');
                if (authorLinkElem != null) {
                    authorLink.href = authorLinkElem.getAttribute('href');
                    authorLink.text = this.getElementValue(authorLinkElem, "text") || "";
                    authorLink.type = this.getElementValue(authorLinkElem, "type") || "";
                }
                author.link = authorLink;
            }
            this.metadata.author = author;

            const link = {} as Link;
            const linkElem = this.queryDirectSelector(parsedMetadata, 'link');
            if (linkElem != null) {
                link.href = linkElem.getAttribute('href');
                link.text = this.getElementValue(linkElem, "text") || "";
                link.type = this.getElementValue(linkElem, "type") || "";
                this.metadata.link = link;
            }
        }

        const wpts = this.xmlSource.querySelectorAll<Element>('wpt');
        for (const waypoint of wpts) {
            if (waypoint.getAttribute("lat") !== null && waypoint.getAttribute("lon") !== null) {
                const pt = {} as Point;
                pt.name = keepThis.getElementValue(waypoint, "name") || "";
                pt.lat = parseFloat(waypoint.getAttribute("lat") as string);
                pt.lon = parseFloat(waypoint.getAttribute("lon") as string);
                pt.ele = parseFloat(keepThis.getElementValue(waypoint, "ele") as string) || 0;
                pt.cmt = keepThis.getElementValue(waypoint, "cmt") || "";
                pt.desc = keepThis.getElementValue(waypoint, "desc") || "";
                keepThis.waypoints.push(pt);
            }
        }

        const rtes = this.xmlSource.querySelectorAll<Element>('rte');
        for (const routes of rtes) {
            const route = {} as Route;
            route.name = keepThis.getElementValue(routes, "name") || "";
            route.cmt = keepThis.getElementValue(routes, "cmt") || "";
            route.desc = keepThis.getElementValue(routes, "desc") || "";
            route.src = keepThis.getElementValue(routes, "src") || "";
            route.number = keepThis.getElementValue(routes, "number") || "";

            const type = keepThis.queryDirectSelector(routes, "type");
            route.type = type != null ? type.innerHTML : "";

            const link = {} as Link;
            const linkElem = routes.querySelector('link');
            if (linkElem != null) {
                link.href = linkElem.getAttribute('href');
                link.text = keepThis.getElementValue(linkElem, "text") || "";
                link.type = keepThis.getElementValue(linkElem, "type") || "";
            }
            route.link = link;

            const routepoints: Point[] = [];
            const rtepts = routes.querySelectorAll<Element>('rtept');

            for (const routepointss of rtepts) {
                const pt = {} as Point;
                pt.lat = parseFloat(routepointss.getAttribute("lat") as string);
                pt.lon = parseFloat(routepointss.getAttribute("lon") as string);
                pt.ele = parseFloat(keepThis.getElementValue(routepointss, "ele") || "");
                routepoints.push(pt);
            }

            route.distance = keepThis.calculDistance(routepoints);
            route.elevation = keepThis.calcElevation(routepoints);
            route.points = routepoints;
            keepThis.routes.push(route);
        }

        const trks = this.xmlSource.querySelectorAll<Element>('trk');
        for (const trackss of trks) {
            const track = {} as Track;

            track.name = keepThis.getElementValue(trackss, "name") || "";
            track.cmt = keepThis.getElementValue(trackss, "cmt") || "";
            track.desc = keepThis.getElementValue(trackss, "desc") || "";
            track.src = keepThis.getElementValue(trackss, "src") || "";
            track.number = keepThis.getElementValue(trackss, "number") || "";

            const type = keepThis.queryDirectSelector(trackss, "type");
            track.type = type != null ? type.innerHTML : "";

            const link = {} as Link;
            const linkElem = trackss.querySelector('link');
            if (linkElem != null) {
                link.href = linkElem.getAttribute('href');
                link.text = keepThis.getElementValue(linkElem, "text") || "";
                link.type = keepThis.getElementValue(linkElem, "type") || "";
            }
            track.link = link;

            const trackpoints = [];
            const trkpts = trackss.querySelectorAll('trkpt');
            for (const trackpoint of trkpts) {
                const pt = {} as Point;
                pt.lat = parseFloat(trackpoint.getAttribute("lat") as string);
                pt.lon = parseFloat(trackpoint.getAttribute("lon") as string);
                pt.ele = parseFloat(keepThis.getElementValue(trackpoint, "ele") || "") || 0;
                trackpoints.push(pt);
            }
            track.distance = keepThis.calculDistance(trackpoints);
            track.elevation = keepThis.calcElevation(trackpoints);
            track.points = trackpoints;

            keepThis.tracks.push(track);

            if (this.config.calculateSections && trackpoints !== null && trackpoints.length > 0) {
                const trackSections = keepThis.calcSections(trackpoints, this.config.sectionLength);
                this.sections.push(trackSections);
            }
        }
    };

    /**
     * Get value from a XML DOM element
     *
     * @param  {Element} parent - Parent DOM Element
     * @param  {string} needle - Name of the searched element
     *
     * @return {string} The element value
     */
    getElementValue(parent: Element, needle: string): string | null {
        const elem = parent.querySelector<Element>(needle);
        if (elem != null) {
            return elem.innerHTML !== undefined ? elem.innerHTML : elem.childNodes[0].nodeValue;
        }
        return null;
    }

    /**
     * Search the value of a direct child XML DOM element
     *
     * @param  {Element} parent - Parent DOM Element
     * @param  {string} needle - Name of the searched element
     *
     * @return {Element} The element value
     */
    queryDirectSelector(parent: Element, needle: string): Element {

        const elements = parent.querySelectorAll(needle);
        let finalElem = elements[0];

        if (elements.length > 1) {
            const directChilds = parent.childNodes;

            for (const child of directChilds as NodeListOf<Element>) {
                if (child.nodeName === needle) {
                    finalElem = child;
                }
            }
        }

        return finalElem;
    }

    /**
     * Calcul the Distance Object from an array of points
     *
     * @param  {} points - An array of points with lat and lon properties
     *
     * @return {DistanceElement} An object with total distance and Cumulative distances
     */
    calculDistance(points: Point[]): DistanceElement {
        const distance = {} as DistanceElement;
        let totalDistance = 0;
        const cumulDistance: number[] = [];
        for (let i = 0; i < points.length - 1; i++) {
            totalDistance += this.calcDistanceBetween(points[i], points[i + 1]);
            cumulDistance[i] = totalDistance;
        }
        cumulDistance[points.length - 1] = totalDistance;

        distance.total = totalDistance;
        distance.cumul = cumulDistance;

        return distance;
    }

    /**
     * Calcul Distance between two points with lat and lon
     *
     * @param  {Waypoint} wpt1 - A geographic point with lat and lon properties
     * @param  {Waypoint} wpt2 - A geographic point with lat and lon properties
     *
     * @returns {number} The distance between the two points
     */
    calcDistanceBetween(wpt1: Waypoint, wpt2: Waypoint): number {
        const latlng1 = {} as Point;
        latlng1.lat = wpt1.lat;
        latlng1.lon = wpt1.lon;
        const latlng2 = {} as Point;
        latlng2.lat = wpt2.lat;
        latlng2.lon = wpt2.lon;
        const rad = Math.PI / 180;
        const lat1 = latlng1.lat * rad;
        const lat2 = latlng2.lat * rad;
        const sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2);
        const sinDLon = Math.sin((latlng2.lon - latlng1.lon) * rad / 2);
        const a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371000 * c;
    };

    /**
     * Calculate elevation for sections with a given length from array of points
     *
     * @param  {Point[]} points - An array of points with lat and lon properties
     * @param  {number} sectionLength - length of track sections
     *
     * @returns {SectionElement[]} array of sections with elevation and distance objects
     */
    calcSections(points: Point[], sectionLength: number): SectionElement[] {
        const sections: SectionElement[] = [];
        let section = [];
        for (let i = 0; i < points.length - 1; i++) {
            const sectionElement = {} as SectionElement;
            const distance = this.calculDistance(section);
            if (distance.total >= sectionLength) {
                sectionElement.distance = distance;
                sectionElement.elevation = this.calcElevation(section);
                sections.push(sectionElement);
                section = [];
            }
            section.push(points[i]);
        }
        return sections;

    };

    /**
     * Generate Elevation Object from an array of points
     *
     * @param  {Point[]} points - An array of points with ele property
     *
     * @returns {ElevationElement} An object with negative and positive height difference and average, max and min altitude data
     */
    calcElevation(points: Point[]): ElevationElement {
        let dp = 0;
        let dm = 0;
        const ret = {} as ElevationElement;

        for (let i = 0; i < points.length - 1; i++) {
            const diff = points[i + 1].ele - points[i].ele;

            if (diff < 0) {
                dm += diff;
            } else if (diff > 0) {
                dp += diff;
            }
        }

        const elevation = [];
        let sum = 0;

        for (let j = 0, len = points.length; j < len; j++) {
            const ele = points[j].ele;
            elevation.push(ele);
            sum += ele;
        }

        ret.max = Math.max.apply(null, elevation);
        ret.min = Math.min.apply(null, elevation);
        ret.pos = Math.abs(dp);
        ret.neg = Math.abs(dm);
        ret.avg = sum / elevation.length;
        ret.abs = dp + dm;

        const distance = this.calculDistance(points);
        ret.slope = 100 / distance.total * (dp + dm);

        return ret;
    };

    /**
     * Export the GPX object to a GeoJSON formatted Object
     *
     * @returns {GeoJSON} a GeoJSON formatted Object
     */
    toGeoJSON(): GeoJSON {
        const geoJson = {} as GeoJSON;
        geoJson.type = "FeatureCollection";
        geoJson.features = [] as Feature[];
        geoJson.properties = {
            name: this.metadata.name,
            desc: this.metadata.desc,
            time: this.metadata.time,
            author: this.metadata.author,
            link: this.metadata.link,
        }

        for (const track of this.tracks) {
            const feature = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [] as number[]
                },
                properties: {
                    name: track.name,
                    cmt: track.cmt,
                    desc: track.desc,
                    src: track.src,
                    number: track.number,
                    link: track.link,
                    type: track.type,
                }
            } as Feature;

            for (const pt of track.points) {
                const geoPt: number[] = [];
                geoPt.push(pt.lon);
                geoPt.push(pt.lat);
                geoPt.push(pt.ele);

                feature.geometry.coordinates.push(geoPt);
            }

            geoJson.features.push(feature);
        }

        for (const track of this.routes) {
            const feature = {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [] as number[]
                },
                properties: {
                    name: track.name,
                    cmt: track.cmt,
                    desc: track.desc,
                    src: track.src,
                    number: track.number,
                    link: track.link,
                    type: track.type,
                }
            } as Feature;

            for (const pt of track.points) {
                const geoPt: number[] = [];
                geoPt.push(pt.lon);
                geoPt.push(pt.lat);
                geoPt.push(pt.ele);

                feature.geometry.coordinates.push(geoPt);
            }

            geoJson.features.push(feature);
        }

        for (const pt of this.waypoints) {
            const feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [pt.lon, pt.lat, pt.ele]
                },
                properties: {
                    name: pt.name,
                    cmt: pt.cmt,
                    desc: pt.desc,
                }
            } as Feature;

            geoJson.features.push(feature);
        }

        return geoJson;
    }
}
export = GpxParser;