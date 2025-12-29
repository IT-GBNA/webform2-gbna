// models/Score.ts
import mongoose, { Document, Schema, model } from 'mongoose';

export interface UserScore extends Document {
  firstName: string;
  lastName: string;
  institution: string;
  service: string;
  newScore: number;
  totalQuestions: number; // Nombre de questions posées (max 20)
  createdAt: Date; // Nouveau champ pour la date et l'heure
  moduleId: string; // Nouveau champ pour l'ID du module
}

const ScoreSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  institution: String,
  service: String,
  newScore: Number,
  totalQuestions: Number, // Nombre de questions posées (max 20)
  createdAt: Date, // Ajout du champ createdAt avec une valeur par défaut
  moduleId: String // Ajout du champ moduleId
});

export const Score = model<UserScore>('Score', ScoreSchema);