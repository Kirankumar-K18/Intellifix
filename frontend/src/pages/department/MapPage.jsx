import { useEffect, useState } from "react";
import { Layout } from "../../components/common/UI";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";
import { complaintAPI } from "../../services/api";

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const res = await complaintAPI.getMap();
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout title="Department Map">
      <div
        style={{
          height: "80vh",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={12}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {complaints.map((complaint) => (
            <Marker
              key={complaint.id}
              position={[
                complaint.latitude,
                complaint.longitude,
              ]}
            >
              <Popup>
                <h3>{complaint.title}</h3>

                <p>
                  <b>Priority:</b> {complaint.priority}
                </p>

                <p>
                  <b>Status:</b> {complaint.status}
                </p>

                <p>{complaint.location}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Layout>
  );
}