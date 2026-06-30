import { useEffect, useState } from "react";
import { FiSave, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Layout } from "../components/common/Layout";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      setSaving(true);

      await authAPI.updateProfile({
        name,
        phone,
      });

      toast.success("Profile updated successfully!");

      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setChanging(true);

      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      toast.success("Password updated successfully");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.old_password?.[0] ||
          "Failed to change password"
      );
    } finally {
      setChanging(false);
    }
  };

  const inputStyle = {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  };

  const readonlyStyle = {
    ...inputStyle,
    background: "rgba(128,128,128,.08)",
    color: "var(--text-secondary)",
  };

  return (
    <Layout title="My Profile">
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
                {/* ================= PROFILE ================= */}

        <Card style={{ padding: 30 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#0D6EFD,#5B5BD6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontSize: 34,
                fontWeight: 700,
                marginBottom: 15,
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <h2 style={{ margin: 0 }}>
              {user?.name}
            </h2>

            <div
              style={{
                color: "var(--text-secondary)",
                marginTop: 6,
                textTransform: "capitalize",
              }}
            >
              {user?.role?.replace("_", " ")}
            </div>
          </div>

          <h3 style={{ marginBottom: 20 }}>
            👤 Profile Information
          </h3>

          <div style={{ marginBottom: 18 }}>
            <label>Full Name</label>

            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label>Email</label>

            <input
              style={readonlyStyle}
              readOnly
              value={user?.email || ""}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label>Phone Number</label>

            <input
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {user?.department_name && (
            <div style={{ marginBottom: 18 }}>
              <label>Department</label>

              <input
                style={readonlyStyle}
                readOnly
                value={user.department_name}
              />
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label>Role</label>

            <input
              style={readonlyStyle}
              readOnly
              value={user?.role?.replace("_", " ").toUpperCase()}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label>Member Since</label>

            <input
              style={readonlyStyle}
              readOnly
              value={
                user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString("en-IN")
                  : "-"
              }
            />
          </div>

          <Button
            onClick={saveProfile}
            disabled={saving}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiSave />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        {/* ================= PASSWORD ================= */}

        <Card style={{ padding: 30 }}>
          <h3 style={{ marginBottom: 24 }}>
            🔒 Change Password
          </h3>

          {/* Current Password */}

          <div style={{ marginBottom: 18 }}>
            <label>Current Password</label>

            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                {showOld ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* New Password */}

          <div style={{ marginBottom: 18 }}>
            <label>New Password</label>

            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                {showNew ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}

          <div style={{ marginBottom: 28 }}>
            <label>Confirm Password</label>

            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <Button
            onClick={updatePassword}
            disabled={changing}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiLock />
            {changing ? "Updating..." : "Update Password"}
          </Button>
        </Card>

      </div>
    </Layout>
  );
}