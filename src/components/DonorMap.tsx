import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DonorMap = ({ donors }: { donors: any[] }) => {
    // Default center (e.g. India) - hardcoded for MVP if no current location
    const center: [number, number] = [20.5937, 78.9629];

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginTop: '2rem', border: '1px solid #ddd' }}>
            <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {donors.map(donor => (
                    // Randomize slightly for demo purpose if lat/lng missing, normally we read from donor.latitude/longitude
                    // For this MVP, we will skip markers if no lat/lng, or mock them based on city (mock implementation)
                    // Since we didn't capture lat/lng in registration, I will just show a placeholder marker at the center
                    // In a real app, Geocoding API would convert city to lat/lng.
                    <Marker key={donor.id} position={center}>
                        <Popup>
                            {donor.name} <br /> {donor.bloodGroup}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default DonorMap;
