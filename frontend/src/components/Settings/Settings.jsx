import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Save, Building2, List, Upload, User, Stethoscope, 
  Plus, X, Trash2, BookOpen, Settings as SettingsIcon,
  Check, Edit2, AlertCircle, CheckCircle, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// ✅ STANDARD MEDICAL FINDINGS DATABASE
// ============================================
const DEFAULT_CLINICAL_LIBRARY = {
  EGD: [
    {
      organ: "Esophagus",
      categories: [
        {
          name: "Inflammatory",
          findings: [
            { name: "Reflux Esophagitis - LA Grade A", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Reflux Esophagitis - LA Grade B", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Reflux Esophagitis - LA Grade C", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Reflux Esophagitis - LA Grade D", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Candida Esophagitis", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "Eosinophilic Esophagitis", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pill-induced Esophagitis", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "CMV Esophagitis", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "HSV Esophagitis", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Structural",
          findings: [
            { name: "Hiatus Hernia", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Stricture", requiresSeverity: true, requiresSize: true, requiresLocation: true },
            { name: "Schatzki Ring", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Esophageal Web", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Zenker's Diverticulum", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Mid-esophageal Diverticulum", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Epiphrenic Diverticulum", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        },
        {
          name: "Vascular",
          findings: [
            { name: "Esophageal Varices - Grade I (Small)", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Esophageal Varices - Grade II (Medium)", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Esophageal Varices - Grade III (Large)", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Esophageal Varices - Grade IV (Very Large)", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Red Color Signs (RCS)", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Cherry Red Spots", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Red Wale Marks", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Post-EVL Ulcer", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Variceal Bleed - Active", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Neoplastic",
          findings: [
            { name: "Esophageal Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Submucosal Lesion", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Esophageal Mass/Growth", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Barrett's Esophagus - Short Segment", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Barrett's Esophagus - Long Segment", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Dysplasia - Low Grade", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Dysplasia - High Grade", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Squamous Cell Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Adenocarcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        },
        {
          name: "Ulcerative",
          findings: [
            { name: "Esophageal Ulcer", requiresSeverity: true, requiresSize: true, requiresLocation: true },
            { name: "Esophageal Erosions", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Mallory-Weiss Tear", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Boerhaave Syndrome", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Other",
          findings: [
            { name: "Inlet Patch", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Glycogenic Acanthosis", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Esophageal Papilloma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Foreign Body", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Food Impaction", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Extrinsic Compression", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "GE Junction",
      categories: [
        {
          name: "Structural",
          findings: [
            { name: "Sliding Hiatus Hernia", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Paraesophageal Hernia", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Incompetent LES", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Hill Grade I", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Hill Grade II", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Hill Grade III", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Hill Grade IV", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Mucosal",
          findings: [
            { name: "Irregular Z-line", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Tongues of Barrett's", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Circumferential Barrett's", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "GEJ Ulcer", requiresSeverity: true, requiresSize: true, requiresLocation: false },
            { name: "GEJ Erosions", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Vascular",
          findings: [
            { name: "GOV Type 1 Varices", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "GOV Type 2 Varices", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Cardiac Varices", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        },
        {
          name: "Neoplastic",
          findings: [
            { name: "GEJ Mass", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Siewert Type I", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Siewert Type II", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Siewert Type III", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        }
      ]
    },
    {
      organ: "Stomach",
      categories: [
        {
          name: "Gastritis",
          findings: [
            { name: "Antral Gastritis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Antral Gastritis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Antral Gastritis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Body Gastritis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Fundal Gastritis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Pangastritis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Erosive Gastritis", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "Hemorrhagic Gastritis", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "Atrophic Gastritis", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Metaplastic Gastritis", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Bile Reflux Gastritis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Chemical Gastropathy", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Portal Hypertensive Gastropathy - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Portal Hypertensive Gastropathy - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Ulcers",
          findings: [
            { name: "Gastric Ulcer - Forrest Ia (Spurting)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Ulcer - Forrest Ib (Oozing)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Ulcer - Forrest IIa (Visible Vessel)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Ulcer - Forrest IIb (Adherent Clot)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Ulcer - Forrest IIc (Hematin)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Ulcer - Forrest III (Clean Base)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Multiple Gastric Ulcers", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Giant Gastric Ulcer (>2cm)", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Kissing Ulcers", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Healing Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Ulcer Scar", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Polyps & Masses",
          findings: [
            { name: "Fundic Gland Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Hyperplastic Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Adenomatous Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Multiple Gastric Polyps", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Polyposis Syndrome", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Submucosal Lesion/GIST", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Carcinoma - Early", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Carcinoma - Advanced", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Linitis Plastica", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Gastric Lymphoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Carcinoid", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        },
        {
          name: "Structural",
          findings: [
            { name: "Pyloric Stenosis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pyloric Stenosis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pyloric Stenosis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Gastric Outlet Obstruction", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Deformed Pylorus", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pyloric Channel Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Retained Food", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Bezoar", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Post-surgical Stomach", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Anastomotic Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Anastomotic Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Vascular",
          findings: [
            { name: "Gastric Varices - IGV1", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Gastric Varices - IGV2", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "GAVE (Watermelon Stomach)", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Dieulafoy Lesion", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Angiodysplasia", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Gastric Antral Vascular Ectasia", requiresSeverity: true, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Other",
          findings: [
            { name: "Xanthoma", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Ménétrier Disease", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Gastric Lipoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Pancreatic Rest", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Foreign Body", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "Duodenum",
      categories: [
        {
          name: "Inflammatory",
          findings: [
            { name: "Bulbar Duodenitis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Bulbar Duodenitis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Bulbar Duodenitis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "D2 Duodenitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Erosive Duodenitis", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Duodenal Erosions", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Hemorrhagic Duodenitis", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Ulcers",
          findings: [
            { name: "Duodenal Ulcer - Anterior Wall", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Duodenal Ulcer - Posterior Wall", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Duodenal Ulcer - D1", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Duodenal Ulcer - D2", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Kissing Ulcers", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Bleeding Duodenal Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ulcer with Visible Vessel", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ulcer with Adherent Clot", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Clean Base Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Healing Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Scarred/Healed Ulcer", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Structural",
          findings: [
            { name: "Deformed Bulb - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Deformed Bulb - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Duodenal Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "Duodenal Web", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Duodenal Diverticulum", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Periampullary Diverticulum", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        },
        {
          name: "Ampullary",
          findings: [
            { name: "Normal Major Papilla", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Prominent Papilla", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ampullary Adenoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ampullary Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Impacted Stone at Ampulla", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Minor Papilla Identified", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Masses",
          findings: [
            { name: "Duodenal Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Duodenal Adenoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Brunner's Gland Hyperplasia", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Duodenal Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Periampullary Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Duodenal GIST", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Duodenal Lipoma", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        },
        {
          name: "Other",
          findings: [
            { name: "Celiac Pattern - Scalloping", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Celiac Pattern - Mosaic", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Celiac Pattern - Villous Atrophy", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Lymphangiectasia", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Duodenal Lymphoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Parasitic Infestation", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Foreign Body", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    }
  ],
  Colonoscopy: [
    {
      organ: "Rectum",
      categories: [
        {
          name: "Hemorrhoids",
          findings: [
            { name: "Internal Hemorrhoids - Grade I", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Internal Hemorrhoids - Grade II", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Internal Hemorrhoids - Grade III", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Internal Hemorrhoids - Grade IV", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Thrombosed Hemorrhoid", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Bleeding Hemorrhoids", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Inflammatory",
          findings: [
            { name: "Proctitis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Proctitis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Proctitis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Radiation Proctitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Ulcerative Proctitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Infectious Proctitis", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Ulcers",
          findings: [
            { name: "Rectal Ulcer", requiresSeverity: true, requiresSize: true, requiresLocation: true },
            { name: "Solitary Rectal Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Stercoral Ulcer", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        },
        {
          name: "Masses",
          findings: [
            { name: "Rectal Polyp - Sessile", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Rectal Polyp - Pedunculated", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Rectal Adenoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Rectal Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Rectal Carcinoid", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Rectal GIST", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        },
        {
          name: "Vascular",
          findings: [
            { name: "Rectal Varices", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Angiodysplasia", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "Sigmoid",
      categories: [
        {
          name: "Diverticular",
          findings: [
            { name: "Diverticulosis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Diverticulosis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Diverticulosis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Diverticulitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Diverticular Bleeding", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Inflammatory",
          findings: [
            { name: "Sigmoid Colitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Ulcerative Colitis - Sigmoid", requiresSeverity: true, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Polyps",
          findings: [
            { name: "Sigmoid Polyp - Sessile", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Sigmoid Polyp - Pedunculated", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Multiple Polyps", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        },
        {
          name: "Structural",
          findings: [
            { name: "Sigmoid Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Sigmoid Volvulus", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Masses",
          findings: [
            { name: "Sigmoid Mass", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Sigmoid Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "Descending Colon",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Colitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Diverticulosis", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Polyp - Sessile", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Polyp - Pedunculated", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Mass/Growth", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false }
          ]
        }
      ]
    },
    {
      organ: "Transverse Colon",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Colitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Polyp - Sessile", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Polyp - Pedunculated", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Mass/Growth", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Lipoma", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "Ascending Colon",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Colitis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Polyp - Sessile", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Polyp - Pedunculated", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Mass/Growth", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Angiodysplasia", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "Lipoma", requiresSeverity: false, requiresSize: true, requiresLocation: true }
          ]
        }
      ]
    },
    {
      organ: "Cecum",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Cecal Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Cecal Mass", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Cecal Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Appendiceal Orifice - Normal", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Appendiceal Orifice - Abnormal", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileocecal Valve - Normal", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileocecal Valve - Abnormal", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Lipomatous ICV", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        }
      ]
    },
    {
      organ: "Terminal Ileum",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Normal Terminal Ileum", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileitis - Mild", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileitis - Moderate", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileitis - Severe", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileal Ulcers", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Aphthous Ulcers", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Crohn's Disease Pattern", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Cobblestoning", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Lymphoid Hyperplasia", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Ileal Polyp", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ileal Mass", requiresSeverity: false, requiresSize: true, requiresLocation: false }
          ]
        }
      ]
    }
  ],
  ERCP: [
    {
      organ: "Ampulla",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Normal Ampulla", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Prominent Ampulla", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ampullary Stenosis", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Ampullary Adenoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Ampullary Carcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Impacted Stone", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Periampullary Diverticulum", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Post-sphincterotomy", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        }
      ]
    },
    {
      organ: "CBD",
      categories: [
        {
          name: "Stones",
          findings: [
            { name: "CBD Stone - Single", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "CBD Stones - Multiple", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "CBD Sludge", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Microlithiasis", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Stricture",
          findings: [
            { name: "Distal CBD Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Mid CBD Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Hilar Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Benign Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "Malignant Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: true }
          ]
        },
        {
          name: "Dilatation",
          findings: [
            { name: "Dilated CBD", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Dilated Intrahepatic Ducts", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        },
        {
          name: "Other",
          findings: [
            { name: "Choledochocele", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Choledochal Cyst", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Cholangiocarcinoma", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "PSC Changes", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Bile Leak", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Post-stent Status", requiresSeverity: false, requiresSize: false, requiresLocation: false }
          ]
        }
      ]
    },
    {
      organ: "Pancreatic Duct",
      categories: [
        {
          name: "Findings",
          findings: [
            { name: "Normal PD", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Dilated PD", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "PD Stricture", requiresSeverity: true, requiresSize: false, requiresLocation: true },
            { name: "PD Stone", requiresSeverity: false, requiresSize: true, requiresLocation: true },
            { name: "PD Stones - Multiple", requiresSeverity: false, requiresSize: true, requiresLocation: false },
            { name: "Chronic Pancreatitis Changes", requiresSeverity: true, requiresSize: false, requiresLocation: false },
            { name: "Chain of Lakes Appearance", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pancreas Divisum", requiresSeverity: false, requiresSize: false, requiresLocation: false },
            { name: "Pancreatic Leak", requiresSeverity: false, requiresSize: false, requiresLocation: true },
            { name: "Pancreatic Duct Disruption", requiresSeverity: false, requiresSize: false, requiresLocation: true }
          ]
        }
      ]
    }
  ],
  Bronchoscopy: []
};

// ============================================
// MAIN SETTINGS COMPONENT
// ============================================
const Settings = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [settings, setSettings] = useState({
    hospitalName: '', 
    hospitalAddress: '', 
    hospitalPhone: '', 
    hospitalEmail: '', 
    hospitalLogo: '',
    adminName: '',
    doctors: [],
    clinicalLibrary: {
      EGD: [],
      Colonoscopy: [],
      ERCP: [],
      Bronchoscopy: []
    },
    procedures: [],
    procedureNames: [], 
    studyTypes: ['Diagnostic', 'Therapeutic', 'Screening', 'Surveillance'], 
    sedationDrugs: [], 
    indications: [],
    therapeuticProcedures: [],
    complications: []
  });

  const [newDoc, setNewDoc] = useState({ name: '', qualification: '', signature: '', specialization: '' });

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      
      console.log("=== LOADED SETTINGS ===");
      console.log("clinicalLibrary:", data.clinicalLibrary);
      
      const clinicalLibrary = {
        EGD: Array.isArray(data.clinicalLibrary?.EGD) ? data.clinicalLibrary.EGD : [],
        Colonoscopy: Array.isArray(data.clinicalLibrary?.Colonoscopy) ? data.clinicalLibrary.Colonoscopy : [],
        ERCP: Array.isArray(data.clinicalLibrary?.ERCP) ? data.clinicalLibrary.ERCP : [],
        Bronchoscopy: Array.isArray(data.clinicalLibrary?.Bronchoscopy) ? data.clinicalLibrary.Bronchoscopy : []
      };

      setSettings({
        hospitalName: data.hospitalName || '',
        hospitalAddress: data.hospitalAddress || '',
        hospitalPhone: data.hospitalPhone || '',
        hospitalEmail: data.hospitalEmail || '',
        hospitalLogo: data.hospitalLogo || '',
        adminName: data.adminName || 'Administrator',
        doctors: Array.isArray(data.doctors) ? data.doctors : [],
        clinicalLibrary: clinicalLibrary,
        procedures: Array.isArray(data.procedures) ? data.procedures : [],
        procedureNames: Array.isArray(data.procedureNames) ? data.procedureNames : [],
        studyTypes: Array.isArray(data.studyTypes) && data.studyTypes.length > 0 ? data.studyTypes : ['Diagnostic', 'Therapeutic', 'Screening', 'Surveillance'],
        sedationDrugs: Array.isArray(data.sedationDrugs) ? data.sedationDrugs : [],
        indications: Array.isArray(data.indications) ? data.indications : [],
        therapeuticProcedures: Array.isArray(data.therapeuticProcedures) ? data.therapeuticProcedures : [],
        complications: Array.isArray(data.complications) ? data.complications : []
      });
      
      setHasUnsavedChanges(false);
    } catch (error) { 
      toast.error('Failed to load settings'); 
      console.error("Fetch error:", error);
    } 
    finally { 
      setLoading(false); 
    }
  };

  const handleSave = async () => {
    const loadingToast = toast.loading('Saving all settings...');
    try {
      console.log("=== SAVING ===");
      console.log("clinicalLibrary EGD count:", settings.clinicalLibrary?.EGD?.length || 0);
      
      const { data } = await api.put('/settings', settings);
      
      console.log("=== SAVE RESPONSE ===");
      console.log("Response EGD count:", data.clinicalLibrary?.EGD?.length || 0);
      
      const clinicalLibrary = {
        EGD: Array.isArray(data.clinicalLibrary?.EGD) ? data.clinicalLibrary.EGD : [],
        Colonoscopy: Array.isArray(data.clinicalLibrary?.Colonoscopy) ? data.clinicalLibrary.Colonoscopy : [],
        ERCP: Array.isArray(data.clinicalLibrary?.ERCP) ? data.clinicalLibrary.ERCP : [],
        Bronchoscopy: Array.isArray(data.clinicalLibrary?.Bronchoscopy) ? data.clinicalLibrary.Bronchoscopy : []
      };
      
      setSettings(prev => ({
        ...prev,
        ...data,
        clinicalLibrary: clinicalLibrary
      }));
      
      setHasUnsavedChanges(false);
      toast.dismiss(loadingToast);
      toast.success('✓ All settings saved successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to save settings');
      console.error("Save error:", error);
    }
  };

  const loadDefaultLibrary = () => {
    if (window.confirm('This will replace your current Clinical Library with comprehensive standard medical findings for EGD, Colonoscopy, and ERCP. Continue?')) {
      setSettings(prev => ({
        ...prev,
        clinicalLibrary: DEFAULT_CLINICAL_LIBRARY
      }));
      setHasUnsavedChanges(true);
      toast.success('Standard medical data loaded! Click "Save All Changes" to persist.');
    }
  };

  const autoSave = async (updatedSettings) => {
    try {
      const { data } = await api.put('/settings', updatedSettings);
      const clinicalLibrary = {
        EGD: Array.isArray(data.clinicalLibrary?.EGD) ? data.clinicalLibrary.EGD : [],
        Colonoscopy: Array.isArray(data.clinicalLibrary?.Colonoscopy) ? data.clinicalLibrary.Colonoscopy : [],
        ERCP: Array.isArray(data.clinicalLibrary?.ERCP) ? data.clinicalLibrary.ERCP : [],
        Bronchoscopy: Array.isArray(data.clinicalLibrary?.Bronchoscopy) ? data.clinicalLibrary.Bronchoscopy : []
      };
      setSettings(prev => ({ ...prev, ...data, clinicalLibrary }));
      setHasUnsavedChanges(false);
      return data;
    } catch (error) {
      console.error('Auto-save failed:', error);
      throw error;
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) return toast.error('File too large (Max 2MB)');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, hospitalLogo: reader.result }));
      setHasUnsavedChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDocSigUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) return toast.error('File too large (Max 2MB)');
    const reader = new FileReader();
    reader.onloadend = () => setNewDoc(prev => ({ ...prev, signature: reader.result }));
    reader.readAsDataURL(file);
  };

  const addDoctor = async () => {
    if (!newDoc.name) return toast.error('Doctor Name required');
    const loadingToast = toast.loading('Adding doctor...');
    try {
      const updatedDoctors = [...settings.doctors, newDoc];
      const updatedSettings = { ...settings, doctors: updatedDoctors };
      await autoSave(updatedSettings);
      setNewDoc({ name: '', qualification: '', signature: '', specialization: '' });
      toast.dismiss(loadingToast);
      toast.success('✓ Doctor added!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to add doctor');
    }
  };

  const removeDoctor = async (index) => {
    if (!window.confirm('Remove this doctor?')) return;
    const loadingToast = toast.loading('Removing doctor...');
    try {
      const updatedDoctors = settings.doctors.filter((_, i) => i !== index);
      const updatedSettings = { ...settings, doctors: updatedDoctors };
      await autoSave(updatedSettings);
      toast.dismiss(loadingToast);
      toast.success('Doctor removed');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to remove doctor');
    }
  };

  const updateList = async (field, newList) => {
    const loadingToast = toast.loading('Saving...');
    try {
      const updatedSettings = { ...settings, [field]: newList };
      await autoSave(updatedSettings);
      toast.dismiss(loadingToast);
      toast.success('✓ Saved!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to save');
      setSettings(prev => ({ ...prev, [field]: newList }));
      setHasUnsavedChanges(true);
    }
  };

  const updateClinicalLibrary = (type, data) => {
    setSettings(prev => ({
      ...prev,
      clinicalLibrary: {
        ...prev.clinicalLibrary,
        [type]: data
      }
    }));
    setHasUnsavedChanges(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading settings...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon size={32} />
              <h1 className="text-3xl font-black tracking-tight">System Configuration</h1>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Configure hospital information, manage doctors, build clinical libraries, and customize dropdown options.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={handleSave} 
              className={`px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${
                hasUnsavedChanges 
                  ? 'bg-yellow-400 text-gray-900 animate-pulse' 
                  : 'bg-white text-blue-600'
              }`}
            >
              <Save size={18} /> 
              {hasUnsavedChanges ? 'Save Unsaved Changes' : 'All Saved'}
            </button>
            {hasUnsavedChanges && (
              <span className="text-yellow-200 text-xs font-semibold flex items-center gap-1">
                <AlertCircle size={12} /> You have unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white p-2 rounded-xl shadow-sm border inline-flex gap-1 flex-wrap">
        {[
          { id: 'doctors', label: 'Doctors', icon: Stethoscope },
          { id: 'branding', label: 'Hospital', icon: Building2 },
          { id: 'procedures', label: 'Procedures', icon: List },
          { id: 'library', label: 'Clinical Library', icon: BookOpen },
          { id: 'clinical', label: 'Dropdown Lists', icon: List }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* DOCTORS TAB */}
      {activeTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border h-fit">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" />
              Add New Doctor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input 
                  type="text" 
                  value={newDoc.name} 
                  onChange={e => setNewDoc({...newDoc, name: e.target.value})} 
                  className="input-field" 
                  placeholder="Dr. John Smith" 
                />
              </div>
              <div>
                <label className="label">Qualification</label>
                <input 
                  type="text" 
                  value={newDoc.qualification} 
                  onChange={e => setNewDoc({...newDoc, qualification: e.target.value})} 
                  className="input-field" 
                  placeholder="MD, DM (Gastroenterology)" 
                />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input 
                  type="text" 
                  value={newDoc.specialization} 
                  onChange={e => setNewDoc({...newDoc, specialization: e.target.value})} 
                  className="input-field" 
                  placeholder="Interventional Endoscopy" 
                />
              </div>
              <div>
                <label className="label">Digital Signature</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                  {newDoc.signature ? (
                    <div>
                      <img src={newDoc.signature} alt="Signature" className="h-16 mx-auto object-contain mb-2" />
                      <button onClick={() => setNewDoc({...newDoc, signature: ''})} className="text-red-500 text-xs flex items-center gap-1 mx-auto">
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ) : (
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  )}
                  <input type="file" accept="image/*" className="text-xs w-full mt-2" onChange={handleDocSigUpload} />
                </div>
              </div>
              <button onClick={addDoctor} className="btn-primary w-full flex items-center justify-center gap-2">
                <Check size={18} /> Add Doctor
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.doctors.length === 0 ? (
              <div className="col-span-2 bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center">
                <Stethoscope size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-semibold">No doctors added yet</p>
              </div>
            ) : (
              settings.doctors.map((doc, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start flex-1">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Stethoscope className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{doc.name}</h4>
                        <p className="text-xs text-gray-500">{doc.qualification}</p>
                        {doc.specialization && <p className="text-xs text-blue-600 font-semibold">{doc.specialization}</p>}
                      </div>
                    </div>
                    <button onClick={() => removeDoctor(idx)} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {doc.signature && (
                    <div className="border-t pt-3 mt-3">
                      <img src={doc.signature} alt="Sig" className="h-12 object-contain opacity-80" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BRANDING TAB */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Hospital Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Hospital Name</label>
                  <input 
                    type="text" 
                    value={settings.hospitalName} 
                    onChange={e => { setSettings({...settings, hospitalName: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="input-field" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <textarea 
                    value={settings.hospitalAddress} 
                    onChange={e => { setSettings({...settings, hospitalAddress: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="input-field" 
                    rows={2}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input 
                    type="text" 
                    value={settings.hospitalPhone} 
                    onChange={e => { setSettings({...settings, hospitalPhone: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input 
                    type="email" 
                    value={settings.hospitalEmail} 
                    onChange={e => { setSettings({...settings, hospitalEmail: e.target.value}); setHasUnsavedChanges(true); }} 
                    className="input-field" 
                  />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Administrator</h3>
              <input 
                type="text" 
                value={settings.adminName} 
                onChange={e => { setSettings({...settings, adminName: e.target.value}); setHasUnsavedChanges(true); }} 
                className="input-field" 
                placeholder="Admin Name"
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border h-fit">
            <h3 className="font-bold mb-4">Hospital Logo</h3>
            {settings.hospitalLogo ? (
              <div>
                <img src={settings.hospitalLogo} alt="Logo" className="h-32 w-full object-contain mb-4" />
                <button onClick={() => { setSettings({...settings, hospitalLogo: ''}); setHasUnsavedChanges(true); }} className="text-red-500 text-sm w-full">
                  Remove Logo
                </button>
              </div>
            ) : (
              <label className="cursor-pointer border-2 border-dashed rounded-xl p-8 block bg-gray-50 text-center">
                <Upload className="mx-auto text-gray-300 mb-2" size={32} />
                <span className="text-xs text-gray-500">Click to upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* PROCEDURES TAB */}
      {activeTab === 'procedures' && (
        <ProcedureManager 
          procedures={settings.procedures}
          onChange={(procs) => { setSettings({...settings, procedures: procs}); setHasUnsavedChanges(true); }}
        />
      )}

      {/* CLINICAL LIBRARY TAB */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-blue-900">Clinical Findings Library</h4>
                <p className="text-sm text-blue-700">
                  Add organs, categories, and findings. Click "Save All Changes" after modifying.
                </p>
              </div>
            </div>
            
            <button 
              onClick={loadDefaultLibrary}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2 whitespace-nowrap shadow-md"
            >
              <Zap size={16} /> Load Standard Medical Data
            </button>
          </div>

          {/* Library Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { type: 'EGD', color: 'blue' },
              { type: 'Colonoscopy', color: 'green' },
              { type: 'ERCP', color: 'purple' },
              { type: 'Bronchoscopy', color: 'orange' }
            ].map(item => (
              <div key={item.type} className={`bg-${item.color}-50 border border-${item.color}-200 rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold text-${item.color}-600`}>
                  {settings.clinicalLibrary?.[item.type]?.length || 0}
                </div>
                <div className="text-xs text-gray-600">{item.type} Organs</div>
              </div>
            ))}
          </div>

          <ClinicalLibraryBuilder 
            title="EGD Findings" 
            data={settings.clinicalLibrary.EGD} 
            onUpdate={(data) => updateClinicalLibrary('EGD', data)} 
          />
          <ClinicalLibraryBuilder 
            title="Colonoscopy Findings" 
            data={settings.clinicalLibrary.Colonoscopy} 
            onUpdate={(data) => updateClinicalLibrary('Colonoscopy', data)} 
          />
          <ClinicalLibraryBuilder 
            title="ERCP Findings" 
            data={settings.clinicalLibrary.ERCP} 
            onUpdate={(data) => updateClinicalLibrary('ERCP', data)} 
          />
          <ClinicalLibraryBuilder 
            title="Bronchoscopy Findings" 
            data={settings.clinicalLibrary.Bronchoscopy} 
            onUpdate={(data) => updateClinicalLibrary('Bronchoscopy', data)} 
          />
        </div>
      )}

      {/* DROPDOWN LISTS TAB */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ListManager title="Procedure Names" items={settings.procedureNames} onUpdate={(l) => updateList('procedureNames', l)} />
          <ListManager title="Indications" items={settings.indications} onUpdate={(l) => updateList('indications', l)} />
          <ListManager title="Sedation Drugs" items={settings.sedationDrugs} onUpdate={(l) => updateList('sedationDrugs', l)} />
          <ListManager title="Therapeutic Procedures" items={settings.therapeuticProcedures} onUpdate={(l) => updateList('therapeuticProcedures', l)} />
          <ListManager title="Complications" items={settings.complications} onUpdate={(l) => updateList('complications', l)} />
        </div>
      )}
    </div>
  );
};

// ============================================
// PROCEDURE MANAGER
// ============================================
const ProcedureManager = ({ procedures, onChange }) => {
  const [formData, setFormData] = useState({ name: '', type: 'EGD', defaultOrgans: [], requiredFields: [] });
  const [editing, setEditing] = useState(null);
  
  const procedureTypes = ['EGD', 'Colonoscopy', 'ERCP', 'Bronchoscopy', 'Other'];
  const organsByType = {
    EGD: ['Esophagus', 'GE Junction', 'Stomach', 'Duodenum'],
    Colonoscopy: ['Rectum', 'Sigmoid', 'Descending Colon', 'Transverse Colon', 'Ascending Colon', 'Cecum', 'Terminal Ileum'],
    ERCP: ['Ampulla', 'CBD', 'Pancreatic Duct'],
    Bronchoscopy: ['Trachea', 'Right Bronchus', 'Left Bronchus'],
    Other: []
  };

  const handleAdd = () => {
    if (!formData.name) return toast.error('Procedure name required');
    onChange([...procedures, formData]);
    setFormData({ name: '', type: 'EGD', defaultOrgans: [], requiredFields: [] });
    toast.success('Procedure added - click Save to persist');
  };

  const handleDelete = (idx) => {
    if (window.confirm('Delete this procedure?')) {
      onChange(procedures.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Add Procedure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Procedure Name *</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="input-field" 
              placeholder="e.g., Diagnostic EGD"
            />
          </div>
          <div>
            <label className="label">Type *</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value, defaultOrgans: []})} 
              className="input-field"
            >
              {procedureTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Default Organs</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {organsByType[formData.type]?.map(organ => (
                <label key={organ} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={formData.defaultOrgans.includes(organ)}
                    onChange={e => {
                      const updated = e.target.checked 
                        ? [...formData.defaultOrgans, organ]
                        : formData.defaultOrgans.filter(o => o !== organ);
                      setFormData({...formData, defaultOrgans: updated});
                    }}
                  />
                  <span className="text-sm">{organ}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleAdd} className="btn-primary mt-4 flex items-center gap-2">
          <Check size={18} /> Add Procedure
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procedures.length === 0 ? (
          <div className="col-span-2 bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center">
            <List size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No procedures configured</p>
          </div>
        ) : (
          procedures.map((proc, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{proc.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold">{proc.type}</p>
                  {proc.defaultOrgans?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proc.defaultOrgans.map(o => (
                        <span key={o} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{o}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// CLINICAL LIBRARY BUILDER
// ============================================
const ClinicalLibraryBuilder = ({ title, data = [], onUpdate }) => {
  const addOrgan = () => {
    const name = prompt('Organ name (must match exactly: Esophagus, GE Junction, Stomach, Duodenum, etc.):');
    if (!name) return;
    onUpdate([...data, { organ: name, categories: [] }]);
  };

  const removeOrgan = (idx) => {
    if (window.confirm(`Remove ${data[idx]?.organ}?`)) {
      onUpdate(data.filter((_, i) => i !== idx));
    }
  };

  const addCategory = (organIdx) => {
    const name = prompt('Category name (e.g., Inflammatory, Vascular, Ulcers):');
    if (!name) return;
    const newData = data.map((organ, i) => {
      if (i === organIdx) {
        return { ...organ, categories: [...organ.categories, { name, findings: [] }] };
      }
      return organ;
    });
    onUpdate(newData);
  };

  const removeCategory = (organIdx, catIdx) => {
    const newData = data.map((organ, i) => {
      if (i === organIdx) {
        return { ...organ, categories: organ.categories.filter((_, j) => j !== catIdx) };
      }
      return organ;
    });
    onUpdate(newData);
  };

  const addFinding = (organIdx, catIdx) => {
    const name = prompt('Finding name:');
    if (!name) return;
    const requiresSeverity = window.confirm('Requires severity/grade?');
    const requiresSize = window.confirm('Requires size measurement?');
    const requiresLocation = window.confirm('Requires location?');

    const newData = data.map((organ, i) => {
      if (i === organIdx) {
        const newCategories = organ.categories.map((cat, j) => {
          if (j === catIdx) {
            return { ...cat, findings: [...cat.findings, { name, requiresSeverity, requiresSize, requiresLocation }] };
          }
          return cat;
        });
        return { ...organ, categories: newCategories };
      }
      return organ;
    });
    onUpdate(newData);
  };

  const removeFinding = (organIdx, catIdx, findingIdx) => {
    const newData = data.map((organ, i) => {
      if (i === organIdx) {
        const newCategories = organ.categories.map((cat, j) => {
          if (j === catIdx) {
            return { ...cat, findings: cat.findings.filter((_, k) => k !== findingIdx) };
          }
          return cat;
        });
        return { ...organ, categories: newCategories };
      }
      return organ;
    });
    onUpdate(newData);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg">{title}</h3>
        <button onClick={addOrgan} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} /> Add Organ
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">No organs configured</p>
          <p className="text-gray-400 text-sm">Click "Load Standard Medical Data" above or add manually</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((organ, oIdx) => (
            <div key={oIdx} className="border-2 rounded-2xl p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-blue-600 text-lg">{organ.organ}</h4>
                <div className="flex gap-2">
                  <button onClick={() => addCategory(oIdx)} className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                    <Plus size={14} /> Category
                  </button>
                  <button onClick={() => removeOrgan(oIdx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {organ.categories?.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No categories. Click "+ Category"</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {organ.categories?.map((cat, cIdx) => (
                    <div key={cIdx} className="bg-white p-3 rounded-xl border">
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className="text-xs font-bold uppercase text-gray-500">{cat.name}</span>
                        <button onClick={() => removeCategory(oIdx, cIdx)} className="text-gray-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                        {cat.findings?.map((f, fIdx) => (
                          <div key={fIdx} className="flex justify-between items-center group">
                            <span className="text-gray-700 truncate flex-1">{f.name}</span>
                            <button onClick={() => removeFinding(oIdx, cIdx, fIdx)} className="opacity-0 group-hover:opacity-100 text-red-400">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addFinding(oIdx, cIdx)} className="w-full text-xs text-blue-600 pt-2 border-t mt-2 font-semibold">
                        + Finding
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// LIST MANAGER
// ============================================
const ListManager = ({ title, items = [], onUpdate }) => {
  const [val, setVal] = useState('');
  
  const add = () => { 
    if (val.trim() && !items.includes(val.trim())) { 
      onUpdate([...items, val.trim()]); 
      setVal(''); 
    } 
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
        {title}
        <CheckCircle size={14} className="text-green-500 ml-auto" />
      </h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          className="input-field text-sm flex-1" 
          placeholder="Add item..." 
          value={val} 
          onChange={e => setVal(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && add()} 
        />
        <button onClick={add} className="bg-blue-600 text-white px-4 rounded-lg">
          <Plus size={18}/>
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2 group">
            {item} 
            <button onClick={() => onUpdate(items.filter((_, j) => j !== i))} className="text-gray-400 group-hover:text-red-500">
              <X size={14}/>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Settings;