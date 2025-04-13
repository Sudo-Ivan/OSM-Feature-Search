document.addEventListener('DOMContentLoaded', () => {
    const osmTags = {
        'amenity': ['restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'school', 'university', 'library', 'hospital', 'pharmacy', 'doctors', 'bank', 'atm', 'parking', 'bicycle_parking', 'bench', 'post_box', 'post_office', 'police', 'fire_station', 'fountain', 'toilets', 'shelter', 'telephone', 'waste_basket', 'recycling', 'marketplace', 'place_of_worship', 'fuel', 'cinema', 'theatre', 'community_centre'],
        'shop': ['supermarket', 'convenience', 'bakery', 'butcher', 'clothes', 'shoes', 'jewelry', 'hairdresser', 'beauty', 'gift', 'bookshop', 'kiosk', 'mall', 'department_store', 'sports', 'electronics', 'hardware', 'furniture', 'garden_centre', 'optician', 'car', 'bicycle'],
        'highway': ['residential', 'service', 'footway', 'path', 'cycleway', 'steps', 'pedestrian', 'bus_stop', 'traffic_signals', 'street_lamp', 'crossing', 'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'track'],
        'building': ['yes', 'house', 'residential', 'apartments', 'commercial', 'industrial', 'retail', 'school', 'university', 'hospital', 'church', 'mosque', 'synagogue', 'temple', 'hotel', 'supermarket', 'warehouse', 'garage', 'roof'],
        'leisure': ['park', 'garden', 'playground', 'sports_centre', 'stadium', 'pitch', 'swimming_pool', 'water_park', 'golf_course', 'miniature_golf', 'fitness_centre', 'dance', 'dog_park', 'track', 'ice_rink'],
        'natural': ['water', 'wood', 'tree', 'scrub', 'heath', 'grassland', 'wetland', 'glacier', 'beach', 'cliff', 'rock', 'stone', 'cave_entrance', 'peak', 'volcano'],
        'railway': ['rail', 'subway', 'light_rail', 'tram', 'station', 'halt', 'tram_stop', 'crossing', 'level_crossing', 'subway_entrance', 'platform', 'bridge', 'tunnel'],
        'landuse': ['residential', 'commercial', 'industrial', 'retail', 'farmland', 'forest', 'grass', 'meadow', 'orchard', 'vineyard', 'cemetery', 'allotments', 'recreation_ground', 'quarry', 'military'],
        'tourism': ['hotel', 'guest_house', 'hostel', 'motel', 'camp_site', 'caravan_site', 'picnic_site', 'information', 'attraction', 'viewpoint', 'museum', 'artwork', 'gallery', 'zoo'],
        'man_made': ['tower', 'water_tower', 'lighthouse', 'windmill', 'bridge', 'tunnel', 'pipeline', 'surveillance', 'crane', 'silo', 'storage_tank', 'chimney', 'communications_tower', 'pier', 'breakwater'],
        'power': ['tower', 'pole', 'line', 'minor_line', 'substation', 'transformer', 'generator', 'plant', 'cable', 'switch', 'insulator', 'portal', 'terminal'],
        'waterway': ['river', 'stream', 'canal', 'drain', 'ditch', 'dam', 'weir', 'waterfall', 'lock_gate', 'dock', 'boatyard', 'riverbank', 'dock']
    };

    function initializeTagAutocomplete() {
        const osmKeysDatalist = document.getElementById('osm-keys');
        const osmValuesDatalist = document.getElementById('osm-values');
        const customKeyInput = document.getElementById('custom-key');
        const customValueInput = document.getElementById('custom-value');
        const negativeKeyInput = document.getElementById('negative-key');
        const negativeValueInput = document.getElementById('negative-value');

        Object.keys(osmTags).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            osmKeysDatalist.appendChild(option);
        });

        function updateValueSuggestions(keyInput, valueInput) {
            const selectedKey = keyInput.value.trim();
            osmValuesDatalist.innerHTML = '';
            
            if (osmTags[selectedKey]) {
                osmTags[selectedKey].forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    osmValuesDatalist.appendChild(option);
                });
            }
        }

        customKeyInput.addEventListener('input', () => updateValueSuggestions(customKeyInput, customValueInput));
        negativeKeyInput.addEventListener('input', () => updateValueSuggestions(negativeKeyInput, negativeValueInput));
    }

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const map = L.map('map', {
        center: [51.505, -0.09],
        zoom: 13,
        layers: [osmLayer]
    });

    const baseMaps = {
        "Dark": cartoDark,
        "Standard": osmLayer,
        "Satellite": esriSatellite
    };

    L.control.layers(baseMaps).addTo(map);

    let resultLayer = L.layerGroup().addTo(map);
    let geocodeMarker = null;

    const presetFeaturesContainer = document.getElementById('preset-features');
    const selectedFeaturesList = document.getElementById('selected-features-list');
    const resultsList = document.getElementById('results-list');
    const maxDistanceInput = document.getElementById('max-distance');
    const customKeyInput = document.getElementById('custom-key');
    const customValueInput = document.getElementById('custom-value');
    const addCustomButton = document.getElementById('add-custom-feature');
    const searchButton = document.getElementById('search-button');

    const areaNameInput = document.getElementById('area-name');
    const negativeFeaturesList = document.getElementById('negative-features-list');
    const negativeKeyInput = document.getElementById('negative-key');
    const negativeValueInput = document.getElementById('negative-value');
    const addNegativeButton = document.getElementById('add-negative-feature');
    const locationSearchInput = document.getElementById('location-search-input');
    const locationSearchButton = document.getElementById('location-search-button');

    let selectedFeatures = [];
    let negativeFeatures = [];
    let lastResults = null;

    const presets = [
        { name: 'Fountain', key: 'amenity', value: 'fountain' },
        { name: 'Tram Stop', key: 'railway', value: 'tram_stop' },
        { name: 'Convenience Store', key: 'shop', value: 'convenience' },
        { name: 'Bus Stop', key: 'highway', value: 'bus_stop' },
        { name: 'Pharmacy', key: 'amenity', value: 'pharmacy' },
        { name: 'Bakery', key: 'shop', value: 'bakery' },
        { name: 'Cafe', key: 'amenity', value: 'cafe' },
        { name: 'Restaurant', key: 'amenity', value: 'restaurant' },
        { name: 'ATM', key: 'amenity', value: 'atm' },
        { name: 'Park Bench', key: 'amenity', value: 'bench' },
        { name: 'Surveillance Camera', key: 'man_made', value: 'surveillance' },
        { name: 'Power Pole', key: 'power', value: 'pole' },
        { name: 'Street Lamp', key: 'highway', value: 'street_lamp' },
        { name: 'Traffic Signals', key: 'highway', value: 'traffic_signals' },
    ];

    function renderPresets() {
        presetFeaturesContainer.innerHTML = '';
        presets.forEach(preset => {
            const button = document.createElement('button');
            button.textContent = preset.name;
            button.title = `${preset.key}=${preset.value}`;
            button.dataset.key = preset.key;
            button.dataset.value = preset.value;
            button.onclick = () => addFeature(preset.key, preset.value, 'preset', preset.name);
            presetFeaturesContainer.appendChild(button);
        });
    }

    function renderSelectedFeatures() {
        selectedFeaturesList.innerHTML = '';
        selectedFeatures.forEach((feature, index) => {
            const li = document.createElement('li');
            li.textContent = `${feature.displayName || feature.key + '=' + feature.value}`;
            const removeButton = document.createElement('button');
            removeButton.textContent = '×';
            removeButton.title = 'Remove feature';
            removeButton.onclick = () => removeFeature(index);
            li.appendChild(removeButton);
            selectedFeaturesList.appendChild(li);
        });
    }

    function addFeature(key, value, type, displayName = null) {
        if (!key || !value) {
            alert('Both key and value are required for custom features.');
            return;
        }
        if (!selectedFeatures.some(f => f.key === key && f.value === value)) {
            selectedFeatures.push({ key, value, type, displayName });
            renderSelectedFeatures();
        }
        if (type === 'custom') {
            customKeyInput.value = '';
            customValueInput.value = '';
        }
    }

    function removeFeature(index) {
        selectedFeatures.splice(index, 1);
        renderSelectedFeatures();
    }

    function escapeOverpassQueryValue(value) {
        return value.replace(/"/g, '\\"');
    }

    function renderNegativeFeatures() {
        negativeFeaturesList.innerHTML = '';
        negativeFeatures.forEach((feature, index) => {
            const li = document.createElement('li');
            li.textContent = `NOT NEAR: ${feature.key}=${feature.value}`;
            const removeButton = document.createElement('button');
            removeButton.textContent = '×';
            removeButton.title = 'Remove negative feature';
            removeButton.onclick = () => removeNegativeFeature(index);
            li.appendChild(removeButton);
            negativeFeaturesList.appendChild(li);
        });
    }

    function addNegativeFeature(key, value) {
        if (!key || !value) {
            alert('Both key and value are required for negative features.');
            return;
        }
        if (!negativeFeatures.some(f => f.key === key && f.value === value)) {
            negativeFeatures.push({ key, value });
            renderNegativeFeatures();
        }
        negativeKeyInput.value = '';
        negativeValueInput.value = '';
    }

    function removeNegativeFeature(index) {
        negativeFeatures.splice(index, 1);
        renderNegativeFeatures();
    }

    function buildOverpassQuery() {
        if (selectedFeatures.length === 0) {
            alert("Please select at least one positive feature.");
            return null;
        }

        const maxDistance = parseInt(maxDistanceInput.value, 10) || 100;
        const timeout = 60;
        const maxsize = 1073741824;

        let query = `[out:json][timeout:${timeout}][maxsize:${maxsize}];\n`;

        const areaName = areaNameInput.value.trim();
        let searchAreaDefinition = "";
        let searchAreaFilter = "";

        if (areaName) {
            const safeAreaName = escapeOverpassQueryValue(areaName);
            searchAreaDefinition = `area["name"="${safeAreaName}"]->.searchArea;\n`;
            searchAreaFilter = "(area.searchArea)";
            query += searchAreaDefinition;
        } else {
            const bounds = map.getBounds();
            const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
            searchAreaFilter = `(${bbox})`;
        }

        selectedFeatures.forEach((feature, i) => {
            query += `(\n`;
            query += `  node["${feature.key}"="${feature.value}"]${searchAreaFilter};\n`;
            query += `  way["${feature.key}"="${feature.value}"]${searchAreaFilter};\n`;
            query += `)->.pos_set${i};\n`;
        });

        negativeFeatures.forEach((feature, i) => {
            query += `(\n`;
            query += `  node["${feature.key}"="${feature.value}"]${searchAreaFilter};\n`;
            query += `  way["${feature.key}"="${feature.value}"]${searchAreaFilter};\n`;
            query += `)->.neg_set${i};\n`;
        });

        if (selectedFeatures.length > 1) {
            query += `node.pos_set0(around:${maxDistance}`;
            for (let i = 1; i < selectedFeatures.length; i++) {
                query += `, .pos_set${i}`;
            }
            query += `)->.candidates;\n`;
        } else {
            query += `(.pos_set0;)->.candidates;\n`;
        }

        if (negativeFeatures.length > 0) {
            query += `// Apply negative filters\n`;
            query += `(.candidates;)->.filtered;\n`;
            negativeFeatures.forEach((feature, i) => {
                query += `node.filtered(around: .neg_set${i}, ${maxDistance})->.near_neg${i}\n`;
                query += `(.filtered; - .near_neg${i};)->.filtered;\n`;
            });
            query += `(.filtered;);
`;
        } else {
            query += `(.candidates;);\n`;
        }

        query += `out geom;`;
        console.log("Overpass Query:", query.replace(/\n/g, '\n'));
        return query;
    }

    async function performSearch() {
        const query = buildOverpassQuery();
        if (!query) return;

        searchButton.textContent = 'Searching...';
        searchButton.disabled = true;
        resultsList.innerHTML = '<li>Loading...</li>';
        resultLayer.clearLayers();
        disableExportButtons();
        lastResults = null;

        const overpassUrl = 'https://overpass-api.de/api/interpreter';

        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: 'data=' + encodeURIComponent(query)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Overpass API error: ${response.status} ${response.statusText}\n${errorText}`);
            }

            const data = await response.json();
            lastResults = data;
            displayResults(data);
            enableExportButtons();

        } catch (error) {
            console.error('Error fetching from Overpass API:', error);
            resultsList.innerHTML = `<li>Error: ${error.message.replace(/\n/g, '<br>')}</li>`;
            alert(`Search failed: ${error.message}`);
            disableExportButtons();
        } finally {
            searchButton.textContent = 'Search';
            searchButton.disabled = false;
        }
    }

    function displayResults(data) {
        resultsList.innerHTML = '';
        resultLayer.clearLayers();

        console.log("Overpass Response Data:", data);

        if (!data.elements || data.elements.length === 0) {
            resultsList.innerHTML = '<li>No results found. Try a larger area or different features.</li>';
            disableExportButtons();
            return;
        }

        const uniqueFeatures = new Map();
        const locationItems = [];

        data.elements.forEach(element => {
            if (!element.id) return;

            if (uniqueFeatures.has(element.id)) return;
            uniqueFeatures.set(element.id, element);

            let displayItem = null;
            let popupContent = '';
            let featureCenter = null;

            try {
                if (element.type === 'node' && element.lat && element.lon) {
                    featureCenter = [element.lat, element.lon];
                    let marker = L.marker(featureCenter);
                    popupContent = `<b>${element.tags?.name || 'Node ' + element.id}</b><br>` +
                                   `Type: Node<br>` +
                                   `Coords: ${element.lat.toFixed(5)}, ${element.lon.toFixed(5)}<br>` +
                                   `<small>${Object.keys(element.tags || {}).map(k => `${k}=${element.tags[k]}`).join(', ')}</small>`;
                    displayItem = { markerOrLayer: marker, center: featureCenter, element };

                } else if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
                    const coordinates = element.geometry.map(pt => [pt.lon, pt.lat]);
                    const isPolygon = (coordinates.length > 2 && coordinates[0][0] === coordinates[coordinates.length - 1][0] && coordinates[0][1] === coordinates[coordinates.length - 1][1]);
                    let geoJsonFeature = {
                        type: "Feature",
                        properties: element.tags || {},
                        geometry: {
                            type: isPolygon ? "Polygon" : "LineString",
                            coordinates: isPolygon ? [coordinates] : coordinates
                        }
                    };
                    let layer = L.geoJSON(geoJsonFeature, {
                         style: function (feature) {
                             return {color: isPolygon ? "#3388ff" : "#ff7800", weight: 5, opacity: 0.65 };
                         }
                    });

                    if (element.center) {
                       featureCenter = [element.center.lat, element.center.lon];
                    } else {
                       let bounds = layer.getBounds();
                       if (bounds.isValid()) {
                           featureCenter = bounds.getCenter();
                           featureCenter = [featureCenter.lat, featureCenter.lng];
                       } else {
                           featureCenter = [element.geometry[0].lat, element.geometry[0].lon];
                       }
                    }

                    popupContent = `<b>${element.tags?.name || 'Way ' + element.id}</b><br>` +
                                   `Type: Way (${isPolygon ? 'Polygon' : 'LineString'})<br>` +
                                   `Center: ${featureCenter[0].toFixed(5)}, ${featureCenter[1].toFixed(5)}<br>` +
                                   `<small>${Object.keys(element.tags || {}).map(k => `${k}=${element.tags[k]}`).join(', ')}</small>`;
                    displayItem = { markerOrLayer: layer, center: featureCenter, element };
                }
            } catch (e) {
                 console.error(`Error processing element ${element.type} ${element.id}:`, e, element);
                 if (element.lat && element.lon) {
                     featureCenter = [element.lat, element.lon];
                 } else if (element.geometry && element.geometry.length > 0) {
                     featureCenter = [element.geometry[0].lat, element.geometry[0].lon];
                 }
                 if(featureCenter) {
                    let marker = L.marker(featureCenter);
                    popupContent = `<b>Error displaying ${element.type} ${element.id}</b><br>See console for details.`;
                    displayItem = { markerOrLayer: marker, center: featureCenter, element };
                 }
            }

            if (displayItem) {
                if (typeof displayItem.markerOrLayer.bindPopup === 'function') {
                    displayItem.markerOrLayer.bindPopup(popupContent);
                } else if (typeof displayItem.markerOrLayer.eachLayer === 'function') {
                     displayItem.markerOrLayer.eachLayer(layer => layer.bindPopup(popupContent));
                }
                 const zoomHandler = () => map.setView(displayItem.center, 17);
                 if (typeof displayItem.markerOrLayer.on === 'function') {
                     displayItem.markerOrLayer.on('click', zoomHandler);
                 } else if (typeof displayItem.markerOrLayer.eachLayer === 'function') {
                     displayItem.markerOrLayer.eachLayer(layer => layer.on('click', zoomHandler));
                 }

                locationItems.push(displayItem);
            }
        });

         if (locationItems.length === 0) {
            resultsList.innerHTML = '<li>No displayable features found in results (check console for details).</li>';
            disableExportButtons();
            return;
        }

        resultsList.innerHTML = `<li>Found ${locationItems.length} potential feature(s).</li><hr>`;

        locationItems.forEach(item => {
            resultLayer.addLayer(item.markerOrLayer);

            const li = document.createElement('li');
            const name = item.element.tags?.name || `${item.element.type} ${item.element.id}`;
            li.textContent = `${name} (${item.center[0].toFixed(4)}, ${item.center[1].toFixed(4)})`;
            li.title = `Click to zoom to ${name}`;
            li.style.cursor = 'pointer';
            li.onclick = () => {
                 map.setView(item.center, 17);
                 if (typeof item.markerOrLayer.openPopup === 'function') {
                    if(!item.markerOrLayer.isPopupOpen()) item.markerOrLayer.openPopup();
                 } else if (typeof item.markerOrLayer.eachLayer === 'function') {
                     item.markerOrLayer.eachLayer(layer => {
                         if(!layer.isPopupOpen()) layer.openPopup();
                     });
                 }
            };
            resultsList.appendChild(li);
        });
    }

    function enableExportButtons() {
        document.getElementById('export-csv').disabled = false;
        document.getElementById('export-geojson').disabled = false;
        document.getElementById('export-kml').disabled = false;
    }

    function disableExportButtons() {
        document.getElementById('export-csv').disabled = true;
        document.getElementById('export-geojson').disabled = true;
        document.getElementById('export-kml').disabled = true;
    }

    function triggerDownload(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getResultCenter(element) {
        if (element.type === 'node' && element.lat && element.lon) {
            return { lat: element.lat, lon: element.lon };
        }
        if (element.center) {
            return { lat: element.center.lat, lon: element.center.lon };
        }
        if (element.type === 'way' && element.geometry && element.geometry.length > 0) {
            let latSum = 0, lonSum = 0;
            element.geometry.forEach(pt => { latSum += pt.lat; lonSum += pt.lon; });
            return { lat: latSum / element.geometry.length, lon: lonSum / element.geometry.length };
        }
         if (element.type === 'relation' && element.members && element.members.length > 0) {
            const firstMemberGeom = element.members[0].geometry;
            if (firstMemberGeom && firstMemberGeom.length > 0) {
                return { lat: firstMemberGeom[0].lat, lon: firstMemberGeom[0].lon };
            }
        }
        return null;
    }

    function formatTagsAsString(tags) {
        if (!tags) return '';
        return Object.entries(tags).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    function exportCSV() {
        if (!lastResults || !lastResults.elements || lastResults.elements.length === 0) {
            alert('No results to export.');
            return;
        }

        let csvContent = "osm_type,osm_id,name,latitude,longitude,tags\n";
        const uniqueElements = new Map();

        lastResults.elements.forEach(el => {
            if (!el.id || uniqueElements.has(el.id)) return;
            uniqueElements.set(el.id, el);

            const center = getResultCenter(el);
            if (!center) return;

            const name = (el.tags?.name || '').replace(/"/g, '""');
            const tags = formatTagsAsString(el.tags).replace(/"/g, '""');

            csvContent += `"${el.type}","${el.id}","${name}",${center.lat.toFixed(7)},${center.lon.toFixed(7)},"${tags}"\n`;
        });

        triggerDownload(csvContent, 'osm_search_results.csv', 'text/csv;charset=utf-8;');
    }

    function exportGeoJSON() {
        if (!lastResults || !lastResults.elements || lastResults.elements.length === 0) {
            alert('No results to export.');
            return;
        }

        const features = [];
        const uniqueElements = new Map();

        lastResults.elements.forEach(el => {
             if (!el.id || uniqueElements.has(el.id)) return;
             uniqueElements.set(el.id, el);

            let geometry = null;
            let properties = { ...el.tags, osm_id: el.id, osm_type: el.type };

            try {
                if (el.type === 'node' && el.lat && el.lon) {
                    geometry = { type: 'Point', coordinates: [el.lon, el.lat] };
                } else if (el.type === 'way' && el.geometry && el.geometry.length > 0) {
                    const coordinates = el.geometry.map(pt => [pt.lon, pt.lat]);
                    const isPolygon = coordinates.length > 2 && coordinates[0][0] === coordinates[coordinates.length - 1][0] && coordinates[0][1] === coordinates[coordinates.length - 1][1];
                    if (isPolygon) {
                        geometry = { type: 'Polygon', coordinates: [coordinates] };
                    } else {
                        geometry = { type: 'LineString', coordinates: coordinates };
                    }
                }
            } catch (e) {
                console.warn(`Could not create GeoJSON geometry for ${el.type} ${el.id}:`, e);
            }

            if (geometry) {
                features.push({
                    type: 'Feature',
                    properties: properties,
                    geometry: geometry
                });
            }
        });

        const geoJson = {
            type: 'FeatureCollection',
            features: features
        };

        triggerDownload(JSON.stringify(geoJson, null, 2), 'osm_search_results.geojson', 'application/geo+json;charset=utf-8;');
    }

    function escapeXMLEntities(str) {
        if (!str) return '';
        return str.replace(/[<>&'"]/g, char => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return char;
            }
        });
    }

    function exportKML() {
        if (!lastResults || !lastResults.elements || lastResults.elements.length === 0) {
            alert('No results to export.');
            return;
        }

        let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>OSM Search Results</name>
`;
        const uniqueElements = new Map();

        lastResults.elements.forEach(el => {
            if (!el.id || uniqueElements.has(el.id)) return;
            uniqueElements.set(el.id, el);

            const name = escapeXMLEntities(el.tags?.name || `${el.type} ${el.id}`);
            let description = `<p><b>OSM Type:</b> ${el.type}<br><b>OSM ID:</b> ${el.id}</p>`;
            description += '<table>';
            for (const key in el.tags) {
                description += `<tr><td>${escapeXMLEntities(key)}</td><td>${escapeXMLEntities(el.tags[key])}</td></tr>`;
            }
            description += '</table>';

            kmlContent += `    <Placemark id="${el.type}-${el.id}">
`;
            kmlContent += `      <name>${name}</name>
`;
            kmlContent += `      <description><![CDATA[${description}]]></description>
`;

            try {
                 if (el.type === 'node' && el.lat && el.lon) {
                    kmlContent += `      <Point><coordinates>${el.lon},${el.lat},0</coordinates></Point>
`;
                } else if (el.type === 'way' && el.geometry && el.geometry.length > 0) {
                    const coordinates = el.geometry.map(pt => `${pt.lon},${pt.lat},0`).join(' ');
                    const isPolygon = el.geometry.length > 2 && el.geometry[0].lat === el.geometry[el.geometry.length - 1].lat && el.geometry[0].lon === el.geometry[el.geometry.length - 1].lon;
                    if (isPolygon) {
                        kmlContent += `      <Polygon><outerBoundaryIs><LinearRing><coordinates>${coordinates}</coordinates></LinearRing></outerBoundaryIs></Polygon>
`;
                    } else {
                         kmlContent += `      <LineString><coordinates>${coordinates}</coordinates></LineString>
`;
                    }
                }
            } catch (e) {
                console.warn(`Could not create KML geometry for ${el.type} ${el.id}:`, e);
                const center = getResultCenter(el);
                if (center) {
                     kmlContent += `      <Point><coordinates>${center.lon},${center.lat},0</coordinates></Point>
`;
                     kmlContent += `      <description><![CDATA[${description}<p><i>Original geometry failed to export, showing center point.</i></p>]]></description>
`;
                } else {
                     kmlContent = kmlContent.substring(0, kmlContent.lastIndexOf('<Placemark'));
                     return;
                }
            }

            kmlContent += `    </Placemark>
`;
        });

        kmlContent += `  </Document>
</kml>`;

        triggerDownload(kmlContent, 'osm_search_results.kml', 'application/vnd.google-earth.kml+xml;charset=utf-8;');
    }

    async function searchLocation() {
        const query = locationSearchInput.value.trim();
        if (!query) return;

        locationSearchButton.textContent = '...';
        locationSearchButton.disabled = true;
        locationSearchInput.disabled = true;

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

        try {
            const response = await fetch(nominatimUrl, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                console.log("Nominatim Result:", result);
                const bounds = [
                    [parseFloat(result.boundingbox[0]), parseFloat(result.boundingbox[2])],
                    [parseFloat(result.boundingbox[1]), parseFloat(result.boundingbox[3])]
                ];

                map.fitBounds(bounds);

                if (geocodeMarker) {
                    map.removeLayer(geocodeMarker);
                }
                geocodeMarker = L.marker([parseFloat(result.lat), parseFloat(result.lon)])
                    .addTo(map)
                    .bindPopup(`<b>${result.display_name}</b>`)
                    .openPopup();

                setTimeout(() => {
                    if (geocodeMarker) {
                        map.removeLayer(geocodeMarker);
                        geocodeMarker = null;
                    }
                }, 5000);

            } else {
                alert('Location not found.');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            alert(`Location search failed: ${error.message}`);
        } finally {
            locationSearchButton.textContent = 'Go';
            locationSearchButton.disabled = false;
            locationSearchInput.disabled = false;
        }
    }

    addCustomButton.addEventListener('click', () => {
        addFeature(customKeyInput.value.trim(), customValueInput.value.trim(), 'custom');
    });

    addNegativeButton.addEventListener('click', () => {
        addNegativeFeature(negativeKeyInput.value.trim(), negativeValueInput.value.trim());
    });

    searchButton.addEventListener('click', performSearch);

    // Add listeners for export buttons
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('export-geojson').addEventListener('click', exportGeoJSON);
    document.getElementById('export-kml').addEventListener('click', exportKML);

    // Add listeners for location search
    locationSearchButton.addEventListener('click', searchLocation);
    locationSearchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchLocation();
        }
    });

    // --- Initial Setup ---
    renderPresets();
    renderSelectedFeatures();
    renderNegativeFeatures();
    initializeTagAutocomplete();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered: ', registration);
                })
                .catch(registrationError => {
                    console.error('Service Worker registration failed: ', registrationError);
                });
        });
    } else {
        console.log('Service Worker is not supported by this browser.');
    }
}); 