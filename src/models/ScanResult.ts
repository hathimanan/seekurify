// models/ScanResult.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IScanResult extends Document {
  user?: Types.ObjectId | null; // optional, if user is authenticated
  type: "file" | "url" | "search";
  fileName: string;
  components: any[]; // store component scan results (array of objects)
  overall: {
    risk: string;
    score: number;
    filesAnalyzed?: number;
    uncompressedBytes?: number;
  };
  notes?: string[];
  createdAt: Date;
}

const ScanResultSchema: Schema = new Schema<IScanResult>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, index: true },
    type: { type: String, enum: ["file", "url", "search"], required: true },
    fileName: { type: String, required: true },
components: {
  type: [
    {
      filename: String,
      sha256: String,
      size: Number,
      magic: String,
      mime: String,
      entropy: Number,
      indicators: [String],
      score: Number,
      risk: String,
      error: String
    }
  ],
  default: []
},    overall: {
      risk: { type: String },
      score: { type: Number },
      filesAnalyzed: { type: Number },
      uncompressedBytes: { type: Number },
    },
    notes: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model<IScanResult>("ScanResult", ScanResultSchema);
