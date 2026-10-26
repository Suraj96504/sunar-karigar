import mongoose from "mongoose";
const { Schema, model } = mongoose;
const options = { timestamps: true };
export const User = model(
  "User",
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true, select: false },
      role: { type: String, enum: ["admin"], default: "admin" },
    },
    options,
  ),
);
export const Service = model(
  "Service",
  new Schema(
    {
      name: { type: String, required: true },
      description: String,
      features: [String],
      price: { type: Number, min: 0, required: true },
      imageIndex: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    options,
  ),
);
export const Charge = model(
  "Charge",
  new Schema(
    {
      name: { type: String, required: true },
      min: { type: Number, min: 0, required: true },
      max: { type: Number, min: 0, required: true },
    },
    options,
  ),
);
export const Booking = model(
  "Booking",
  new Schema(
    {
      name: String,
      phone: String,
      address: String,
      city: String,
      service: { type: Schema.Types.ObjectId, ref: "Service" },
      serviceName: String,
      date: String,
      time: String,
      status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending",
      },
    },
    options,
  ),
);
export const Message = model(
  "Message",
  new Schema(
    {
      name: String,
      email: String,
      message: String,
      status: {
        type: String,
        enum: ["Unread", "Read", "Resolved"],
        default: "Unread",
      },
    },
    options,
  ),
);
export const Settings = model(
  "Settings",
  new Schema(
    {
      key: { type: String, unique: true, default: "business" },
      name: String,
      phone: String,
      email: String,
      address: String,
      hours: String,
    },
    options,
  ),
);
