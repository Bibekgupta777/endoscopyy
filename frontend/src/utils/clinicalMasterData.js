export const CLINICAL_MASTER = {
  EGD: {
    Esophagus: {
      Inflammatory: ["Reflux esophagitis (LA Grade A–D)", "Infectious esophagitis (Candida, CMV, HSV)", "Eosinophilic esophagitis", "Chemical injury"],
      Structural: ["Stricture", "Web", "Ring (Schatzki ring)", "Diverticulum", "Hiatus hernia"],
      Vascular: ["Esophageal varices (Grade I–IV)", "Portal hypertensive changes", "Angiodysplasia"],
      UlceroErosive: ["Erosions", "Ulcer", "Bleeding lesion"],
      Neoplastic: ["Polyp", "Barrett’s esophagus", "Dysplasia", "Carcinoma", "Submucosal lesion"]
    },
    GEJunction: {
      Findings: ["Normal", "Incompetent LES", "Hiatus hernia", "Irregular Z-line", "Barrett’s changes", "Ulcer", "Growth"]
    },
    Stomach: {
      Inflammatory: ["Gastritis (mild, moderate, severe)", "Erosive gastritis", "Hemorrhagic gastritis", "Atrophic gastritis", "Bile reflux gastritis", "Portal hypertensive gastropathy"],
      Ulcerative: ["Gastric ulcer", "Multiple ulcers", "Bleeding ulcer"],
      Vascular: ["Gastric varices", "Angiodysplasia"],
      Structural: ["Pyloric stenosis", "Deformity", "Retained food", "Mucosal nodularity"],
      Neoplastic: ["Polyp", "Submucosal tumor", "GIST", "Adenocarcinoma", "Linitis plastica"]
    },
    Duodenum: {
      Inflammatory: ["Duodenitis", "Erosions"],
      Ulcerative: ["Duodenal ulcer", "Bleeding ulcer"],
      Structural: ["Deformity", "Stricture", "Diverticulum"],
      Neoplastic: ["Polyp", "Growth", "Periampullary tumor"]
    }
  },
  Colonoscopy: {
    Colon: {
      Inflammatory: ["Colitis", "Ulcerative colitis", "Crohn’s disease", "Infectious colitis", "Ischemic colitis"],
      Ulcerative: ["Ulcer", "Aphthous ulcer", "Deep ulcer"],
      Polyps: ["Sessile polyp", "Pedunculated polyp", "Multiple polyps", "Adenomatous polyp", "Hyperplastic polyp"],
      Vascular: ["Hemorrhoids", "Angiodysplasia", "Telangiectasia"],
      Structural: ["Diverticulosis", "Stricture", "Obstruction", "Mass lesion", "Fistula"],
      Neoplastic: ["Carcinoma", "Dysplasia", "Submucosal tumor"]
    }
  },
  ERCP: {
    Biliary: ["CBD stone", "Sludge", "Dilated CBD", "Stricture", "Cholangiocarcinoma", "Leak", "Filling defect"],
    Pancreatic: ["Stricture", "Dilatation", "Stone", "Leak", "Chronic pancreatitis changes"]
  }
};