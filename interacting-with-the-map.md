# Giving information back to the map

## Documentation

The front-end of our application is always expecting the same result's structure. It is a JSON object composed of the four 5 optional attributes explained below.

### error (optional)
`error` is an optional String. If it is defined the application will display an error message and won't try anything else.

### position (optional)
`position` is an optional JSON object that you need to give if you want the map to be centered around a new point. If `position` is `undefined` the map will stay at the same position when receiving the new data. Here is its attributes:
- `latitude`: Number, latitude of the new map's center.
- `longitude`: Number, longitude of the new map's center.
- `zoom` (optional): Number, zoom of the map, has to be between 10 and 18. If `undefined` the map will stay at its current zoom level.

### markers (optional)
`markers` is an optional array of JSON objects that you need to give if you want the map to have markers. If `markers` is `undefined` the map will not display any markers. Here is its attributes of a marker:
- `latitude`: Number, latitude of the marker.
- `longitude`: Number, longitude of the marker.
- `popup`: String, text to display in the popup. If `""` the marker won't have any pop-up.
- `options`: JSON containing optional values:
 - `title` (optional): String, text for the browser tooltip that appear on marker hover (no tooltip by default).
 - `alt` (optional): String, text for the alt attribute of the icon image (useful for accessibility).
 - `zIndexOffset` (optional): Number, zIndex for the marker image is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like 1000 (or high negative value, respectively).
opacity	Number	1.0	The opacity of the marker.
 - `opacity` (optional): Number, opacity of the market, has to be between 0 (transparent) and 1 (opaque). If `undefined` the value will be 1.
 - `icon`(optional): String, icon of the marker (see `webapp/public/markers` to see the possibilities).
- `onclick` (optional): Boolean, if true the query `info()` will be fired using the id of the marker that needs to be contained in `alt `.

### circles (optional)
`circles` is an optional array of JSON objects that you need to give if you want the map to have circles. If `circles` is `undefined` the map will not display any circles. Here is its attributes of a circle:
- `latitude`: Number, latitude of the circle.
- `longitude`: Number, longitude of the circle.
- `radius`: Number, radius of the circle in meters.
- `popup`: String, text to display in the popup. If `""` the circle won't have any pop-up.
- `options`: JSON containing optional values:
 - `stroke` (optional): Boolean, whether to draw stroke along the path. Default value is true.
 - `color` (optional): String, stroke color, if `undefined` it will be `#03f`.
 - `weight` (optional): Number, stroke width in pixels, default value is 5.
 - `opacity` (optional): Number,	stroke opacity, default value is 0.5.
 - `fill` (optional): Boolean, set it to false to disable filling on polygons or circles.
 - `fillColor` (optional): String, fill color, default value is the same value as `color`.
 - `fillOpacity` (optional): Number, fill opacity, default value is 0.2.

### polygons (optional)
`polygons` is an optional array of JSON objects that you need to give if you want the map to have polygons. If `polygons` is `undefined` the map will not display any polygons. Here is its attributes of a polygon:
- `points`: Array of JSON objects, two mandatory informations for each `point`: `longitude` (Number, longitude of the point) and `latitude` (Number, latitude of the point).
- `popup`: String, text to display in the popup. If `""` the polygon won't have any pop-up.
- `options`: JSON containing optional values:
 - `stroke` (optional): Boolean, whether to draw stroke along the path. Default value is true.
 - `color` (optional): String, stroke color, if `undefined` it will be `#03f`.
 - `weight` (optional): Number, stroke width in pixels, default value is 5.
 - `opacity` (optional): Number,	stroke opacity, default value is 0.5.
 - `fill` (optional): Boolean, set it to false to disable filling on polygons or circles.
 - `fillColor` (optional): String, fill color, default value is the same value as `color`.
 - `fillOpacity` (optional): Number, fill opacity, default value is 0.2.

## Examples
### Example 1: one simple marker
```javascript
function oneSimpleMarker() {
    return {
        markers: [
            { latitude: 51.5, longitude: -0.09 }
        ]
    }
}
```

### Example 2: centered two markers
```javascript
function centeredTwoMarker() {
    return {
        position: {
            latitude: 51.495,
            longitude: -0.09,
            zoom: 15
        },
        markers: [
            {
                latitude: 51.5,
                longitude: -0.09,
                popup: 'Marker A'
            },
            {
                latitude: 51.49,
                longitude: -0.09,
                popup: '',
                options: {
                    title: 'This is a title, not a popup'
                }
            }
        ]
    }
}
```
