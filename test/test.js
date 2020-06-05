const gpxParser = require('../build/src/GPXParser.js');
var fs = require('fs');
var assert = require('assert');
require('jsdom-global')();
global.DOMParser = window.DOMParser;

describe('Parser object', function () {
    let parser = new gpxParser();

    it('should have basic properties', function () {
        assert.notEqual(parser.xmlSource, undefined);
        assert.notEqual(parser.metadata, undefined);
        assert.notEqual(parser.waypoints, undefined);
        assert.notEqual(parser.tracks, undefined);
        assert.notEqual(parser.routes, undefined);
    });
});

/*
describe('GPX parser with options', function () {
    let gpxDemo = fs.readFileSync('./test/sampleData.gpx', 'utf8');

    let options = {
        calculateSections: true,
        sectionLength: 250,
        precision: 2,
    };

    let parser = new gpxParser();
    parser.parse(gpxDemo, options);

    it('should contain sections', function () {
        let calculatedSections = parser.sections;
        assert.equal(1, calculatedSections.length);
    });

    it('should fix calculated numbers to 2 digits behind serpation point', function () {
        let parsedTracks = parser.tracks;

        assert.equal(1, parsedTracks.length);

        let track = parsedTracks[0];

        assert.equal(14.15, track.elevation.avg);
    });

});
*/

describe('GPX parser', function () {
    let gpxDemo = fs.readFileSync('./test/sampleData.gpx', 'utf8');
    let parser = new gpxParser();
    parser.parse(gpxDemo);


    it('should parse metadata', function () {

        let parsedMetadata = parser.metadata;

        assert.equal('GPX DEMO', parsedMetadata.name);
        assert.equal('A full featured gpx demo file', parsedMetadata.desc);
        assert.equal('2020-01-12T21:32:52', parsedMetadata.time);
        assert.equal('Demo Author', parsedMetadata.author.name);
        assert.equal('demo', parsedMetadata.author.email.id);
        assert.equal('example.com', parsedMetadata.author.email.domain);
        assert.equal('http://example.com', parsedMetadata.author.link.href);
        assert.equal('Web', parsedMetadata.author.link.type);
        assert.equal('http://example.com', parsedMetadata.link.href);
        assert.equal('Author website', parsedMetadata.link.text);
        assert.equal('Web', parsedMetadata.link.type);

    });

    it('should parse waypoints', function () {
        let parsedWaypoints = parser.waypoints;

        assert.equal(2, parsedWaypoints.length);

        let wpt0 = parsedWaypoints[0];
        assert.equal('Porte de Carquefou', wpt0.name);
        assert.equal(47.253146555709, wpt0.lat);
        assert.equal(-1.5153741828293, wpt0.lon);
        assert.equal(35, wpt0.ele);
        assert.equal('Warning', wpt0.cmt);
        assert.equal('Route', wpt0.desc);

        let wpt1 = parsedWaypoints[1];
        assert.equal('Pont de la Tortière', wpt1.name);
        assert.equal(47.235331031612, wpt1.lat);
        assert.equal(-1.5482325613225, wpt1.lon);
        assert.equal(20, wpt1.ele);
        assert.equal('Bridge', wpt1.cmt);
        assert.equal('Route', wpt1.desc);
    });

    it('should parse tracks', function () {
        let parsedTracks = parser.tracks;

        assert.equal(1, parsedTracks.length);

        let track = parsedTracks[0];

        assert.equal('Track', track.name);
        assert.equal('Bridge', track.cmt);
        assert.equal('Demo track', track.desc);
        assert.equal('GPX Parser', track.src);
        assert.equal('1', track.number);
        assert.equal('MTB', track.type);

        assert.equal('http://example.com', track.link.href);
        assert.equal('Author website', track.link.text);
        assert.equal('Web', track.link.type);

        assert.equal(6955.702190644043, track.distance.total);
        assert.equal(205, track.distance.cumul.length);

        assert.equal(31.6, track.elevation.max);
        assert.equal(4.09, track.elevation.min);
        assert.equal(71.03999999999998, track.elevation.pos);
        assert.equal(69.44000000000001, track.elevation.neg);
        assert.equal(14.148731707317081, track.elevation.avg);

        assert.equal(205, track.points.length);

        track.points.forEach(function (pt) {
            assert.notEqual(pt.lat, undefined);
            assert.notEqual(pt.lon, undefined);
            assert.notEqual(pt.ele, undefined);
        });
    });

    it('should parse routes', function () {
        let parsedRoutes = parser.routes;

        assert.equal(1, parsedRoutes.length);

        let route = parsedRoutes[0];

        assert.equal('Track', route.name);
        assert.equal('Bridge', route.cmt);
        assert.equal('Demo track', route.desc);
        assert.equal('GPX Parser', route.src);
        assert.equal('1', route.number);
        assert.equal('MTB', route.type);

        assert.equal('http://example.com', route.link.href);
        assert.equal('Author website', route.link.text);
        assert.equal('Web', route.link.type);

        assert.equal(6955.702190644043, route.distance.total);
        assert.equal(205, route.distance.cumul.length);

        assert.equal(31.6, route.elevation.max);
        assert.equal(4.09, route.elevation.min);
        assert.equal(71.03999999999998, route.elevation.pos);
        assert.equal(69.44000000000001, route.elevation.neg);
        assert.equal(14.148731707317081, route.elevation.avg);

        assert.equal(205, route.points.length);

        route.points.forEach(function (pt) {
            assert.notEqual(pt.lat, undefined);
            assert.notEqual(pt.lon, undefined);
            assert.notEqual(pt.ele, undefined);
        });
    });

    it('should calculate sections', function () {
        let parsedTracks = parser.tracks;
        assert.equal(1, parsedTracks.length);

        let sections = parser.calcSections(parsedTracks[0].points, 100);
        
        assert.equal(43, sections.length);
        
        sections = parser.calcSections(parsedTracks[0].points, 10);

        assert.equal(98, sections.length);
    });

    it('GetElementValue should be null', function () {

        let elemValue = parser.getElementValue(parser.xmlSource, 'inexistant');

        assert.equal(null, elemValue);
    });

});

describe('GeoJSON exporter', function () {
    let gpxDemo = fs.readFileSync('./test/sampleData.gpx', 'utf8');
    let parser = new gpxParser();
    parser.parse(gpxDemo);

    let geoJSON = parser.toGeoJSON();
    it('should export correct metadata', function () {
        assert.equal('FeatureCollection', geoJSON.type);
        assert.equal(4, geoJSON.features.length);
        assert.deepEqual(geoJSON.properties, parser.metadata);
    });

    let features = geoJSON.features;

    it('should export correct features', function () {
        let f0 = features[0];
        assert.equal('LineString', f0.geometry.type);
        assert.equal(205, f0.geometry.coordinates.length);

        f0.geometry.coordinates.forEach(function (pt) {
            assert.equal(3, pt.length);
        });

        assert.equal('Track', f0.properties.name);
        assert.equal('Bridge', f0.properties.cmt);
        assert.equal('Demo track', f0.properties.desc);
        assert.equal('GPX Parser', f0.properties.src)
        assert.equal('1', f0.properties.number);
        assert.equal('http://example.com', f0.properties.link.href);
        assert.equal('Author website', f0.properties.link.text);
        assert.equal('Web', f0.properties.link.type);
        assert.equal('MTB', f0.properties.type);

        let f1 = features[1];
        assert.equal('LineString', f1.geometry.type);
        assert.equal(205, f1.geometry.coordinates.length);

        f1.geometry.coordinates.forEach(function (pt) {
            assert.equal(3, pt.length);
        });

        assert.equal('Track', f1.properties.name);
        assert.equal('Bridge', f1.properties.cmt);
        assert.equal('Demo track', f1.properties.desc);
        assert.equal('GPX Parser', f1.properties.src)
        assert.equal('1', f1.properties.number);
        assert.equal('http://example.com', f1.properties.link.href);
        assert.equal('Author website', f1.properties.link.text);
        assert.equal('Web', f1.properties.link.type);
        assert.equal('MTB', f1.properties.type);

        let f2 = features[2];
        let feature2 = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-1.5153741828293, 47.253146555709, 35]
            },
            properties: {
                name: 'Porte de Carquefou',
                cmt: 'Warning',
                desc: 'Route'
            }
        };
        assert.deepEqual(feature2, f2);

        let f3 = features[3];
        let feature3 = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-1.5482325613225, 47.235331031612, 20]
            },
            properties: {
                name: 'Pont de la Tortière',
                cmt: 'Bridge',
                desc: 'Route'
            }
        };
        assert.deepEqual(feature3, f3);
    });
});
