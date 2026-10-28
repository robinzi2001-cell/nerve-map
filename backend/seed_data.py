import copy
import json
import math
from pathlib import Path

import numpy as np


def mirror(path):
    return [[-p[0], p[1], p[2]] for p in path]


def bilateral(path):
    return [path, mirror(path)]


def C(label, text, evidence, tradition="Schulmedizin"):
    return {"label": label, "text": text, "evidence": evidence, "tradition": tradition}


NERVE_SELF_HEAL = C(
    "Nerven-Selbstheilung",
    "Periphere Nerven können nach Schädigung regenerieren (Waller'sche Degeneration, danach Aussprossen des Axons mit ca. 1–3 mm pro Tag). Neuropraxie heilt meist vollständig in Wochen; Axonotmesis langsamer; Neurotmesis braucht oft OP. Zentrale Nerven (Rückenmark) regenerieren kaum.",
    "gut",
)

NERVES = [
    dict(code="medulla-spinalis", name="Rückenmark", latin="Medulla spinalis", layer="nerven", color="#2F6FB0",
         paths=[[[0, 1.56, -0.04], [0, 1.45, -0.06], [0, 1.2, -0.08], [0, 1.0, -0.07]]],
         description="Zentrale Leitungsbahn zwischen Gehirn und peripheren Nerven. Aus jedem Segment treten Spinalnerven aus (C1–Co1).",
         symptoms=["Gefühlsstörungen beidseitig", "Lähmungen", "Blasen-/Darmstörungen"],
         conditions=["Bandscheibenvorfall (zentral)", "Spinalkanalstenose", "Multiple Sklerose"],
         technique="Keine Druckbehandlung. Therapeutisch: Neurodynamik (Slump-Test) nur durch geschultes Personal.",
         contraindications="Akute neurologische Ausfälle (Cauda-equina-Symptome) → sofort ärztlich abklären.",
         evidence="gut", tradition="Schulmedizin", pubmed_query="spinal cord regeneration review",
         claims=[C("Regeneration", "Das zentrale Nervensystem regeneriert nur sehr eingeschränkt (hemmende Glianarbe, Myelin-Inhibitoren).", "gut")]),
    dict(code="n-ischiadicus", name="Ischiasnerv", latin="N. ischiadicus", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.03, 1.0, -0.08], [-0.07, 0.9, -0.09], [-0.09, 0.75, -0.06], [-0.1, 0.55, -0.04], [-0.1, 0.3, -0.04], [-0.09, 0.1, -0.02], [-0.1, 0.02, 0.06]]),
         description="Dickster Nerv des Körpers (L4–S3). Verläuft unter/durch den M. piriformis an der Oberschenkelrückseite, teilt sich in N. tibialis und N. fibularis.",
         symptoms=["Ausstrahlender Schmerz Gesäß bis Fuß", "Kribbeln Fußsohle", "Fußheberschwäche"],
         conditions=["Ischialgie", "Piriformis-Syndrom", "Bandscheibenvorfall L5/S1"],
         technique="Massage: Piriformis & Glutealmuskulatur mit flächigem Druck, nie punktuell direkt auf den Nerv. Physio: Nervengleiten (Sliders) in Seitlage/Sitz.",
         contraindications="Progrediente Lähmung, Blasenstörung, Sattelanästhesie.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="neural mobilization sciatica systematic review",
         claims=[NERVE_SELF_HEAL, C("Nervenmobilisation", "Neurodynamische Techniken zeigen in Reviews moderate Effekte auf Schmerz und Funktion bei Rücken-/Beinschmerz.", "maessig")]),
    dict(code="n-femoralis", name="Oberschenkelnerv", latin="N. femoralis", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.03, 1.02, -0.03], [-0.06, 0.92, 0.06], [-0.09, 0.75, 0.07], [-0.08, 0.55, 0.03], [-0.08, 0.3, 0.0], [-0.08, 0.08, 0.02]]),
         description="Aus L2–L4, zieht unter dem Leistenband zur Oberschenkelvorderseite; Endast N. saphenus bis zum Innenknöchel. Verläuft eng am M. iliopsoas.",
         symptoms=["Schmerz Leiste/Oberschenkel vorne", "Kniestreckschwäche", "Taubheit Unterschenkel innen"],
         conditions=["Psoas-Verspannung", "Hernie L3/L4", "Postoperative Läsion"],
         technique="Psoas-Release nur sanft, flächig. Physio: Femoralis-Slider in Seitlage.",
         contraindications="Aneurysma, Schwangerschaft (Bauchdruck).",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="femoral nerve neuropathy",
         claims=[NERVE_SELF_HEAL]),
    dict(code="n-medianus", name="Mittelarmnerv", latin="N. medianus", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.05, 1.45, -0.04], [-0.17, 1.38, 0.02], [-0.23, 1.15, 0.03], [-0.27, 0.95, 0.04], [-0.29, 0.86, 0.05], [-0.3, 0.76, 0.06]]),
         description="Aus C6–Th1, läuft durch den Karpaltunnel. Versorgt Daumen, Zeige- und Mittelfinger.",
         symptoms=["Nächtliches Kribbeln Finger 1–3", "Daumenballen-Schwäche"],
         conditions=["Karpaltunnelsyndrom", "Pronator-teres-Syndrom"],
         technique="Massage Unterarmbeuger & Pronator teres. Physio: Median-Nerve-Slider, Handgelenks-Mobilisation.",
         contraindications="Thenaratrophie → ärztliche Abklärung.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="carpal tunnel syndrome nerve gliding exercises",
         claims=[NERVE_SELF_HEAL, C("Nervengleitübungen", "Bei Karpaltunnelsyndrom zeigen Studien kleine bis moderate Effekte; Schienen und Kortison-Injektion sind besser belegt.", "maessig")]),
    dict(code="n-ulnaris", name="Ellennerv", latin="N. ulnaris", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.05, 1.44, -0.04], [-0.18, 1.36, -0.01], [-0.24, 1.13, -0.03], [-0.27, 0.95, 0.0], [-0.3, 0.85, 0.01], [-0.32, 0.76, 0.02]]),
         description="Aus C8–Th1, oberflächlich im Sulcus ulnaris („Musikantenknochen“). Versorgt Ring- und kleinen Finger.",
         symptoms=["Kribbeln Finger 4–5", "Schwäche Fingerspreizen"],
         conditions=["Kubitaltunnelsyndrom", "Loge de Guyon"],
         technique="Kein Druck am Ellbogen-Sulcus! Ulnaris-Slider, Ellbogen nachts nicht stark beugen.",
         contraindications="Direkter Druck im Sulcus ulnaris.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="cubital tunnel syndrome conservative treatment",
         claims=[NERVE_SELF_HEAL]),
    dict(code="n-radialis", name="Speichennerv", latin="N. radialis", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.05, 1.45, -0.05], [-0.2, 1.36, -0.04], [-0.25, 1.2, -0.04], [-0.26, 1.12, 0.02], [-0.28, 0.95, 0.03], [-0.29, 0.86, 0.04]]),
         description="Aus C5–Th1, windet sich um den Oberarmknochen. Versorgt die Strecker von Arm und Hand.",
         symptoms=["Fallhand", "Taubheit Handrücken radial"],
         conditions=["Parkbanklähmung", "Supinatorlogen-Syndrom", "Humerusschaftfraktur"],
         technique="Massage M. supinator / Extensoren flächig. Radialis-Slider.",
         contraindications="Frische Fraktur.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="radial nerve palsy recovery",
         claims=[NERVE_SELF_HEAL]),
    dict(code="n-trigeminus-v2", name="Oberkiefernerv (Trigeminus V2)", latin="N. maxillaris", layer="nerven", color="#C0392B",
         paths=bilateral([[-0.035, 1.62, 0.0], [-0.05, 1.605, 0.04], [-0.035, 1.598, 0.075]]),
         description="2. Ast des N. trigeminus. Versorgt über die Nn. alveolares superiores (anterior, medius, posterior) alle Oberkieferzähne, Kieferhöhle, Oberlippe.",
         symptoms=["Zahnschmerz Oberkiefer", "Schmerz Wange/Kieferhöhle", "Ausstrahlung zur Schläfe"],
         conditions=["Pulpitis", "Sinusitis maxillaris", "Trigeminusneuralgie V2"],
         technique="Sanfte Massage M. masseter / temporalis. Keine Behandlung bei akuter Entzündung.",
         contraindications="Akute Zahnentzündung, Abszess → Zahnarzt.",
         evidence="gut", tradition="Schulmedizin", pubmed_query="trigeminocervical complex referred pain",
         claims=[C("Trigemino-zervikaler Komplex", "Der Nucleus spinalis n. trigemini reicht bis ins Halsmark (C2–C3). Dort konvergieren Signale aus Kiefer/Zähnen und Nacken – das erklärt übertragene Schmerzen zwischen Zähnen, Kiefer, Kopf und Nacken.", "gut")]),
    dict(code="n-trigeminus-v3", name="Unterkiefernerv (Trigeminus V3)", latin="N. mandibularis", layer="nerven", color="#C0392B",
         paths=bilateral([[-0.035, 1.62, 0.0], [-0.06, 1.58, 0.03], [-0.035, 1.555, 0.07]]),
         description="3. Ast des N. trigeminus. Über den N. alveolaris inferior werden alle Unterkieferzähne versorgt; motorisch die Kaumuskeln.",
         symptoms=["Zahnschmerz Unterkiefer", "Taubheit Kinn/Lippe", "Kaumuskelschmerz"],
         conditions=["CMD", "Bruxismus", "Nervverletzung nach Weisheitszahn-OP"],
         technique="Masseter- und Temporalis-Massage, Unterkiefer-Mobilisation (Physio CMD).",
         contraindications="Frische Kiefer-OP.",
         evidence="gut", tradition="Schulmedizin", pubmed_query="inferior alveolar nerve injury recovery",
         claims=[NERVE_SELF_HEAL]),
    dict(code="n-facialis", name="Gesichtsnerv", latin="N. facialis", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.07, 1.62, -0.02], [-0.09, 1.6, 0.02], [-0.07, 1.63, 0.07]]),
         description="VII. Hirnnerv. Steuert die mimische Muskulatur.",
         symptoms=["Einseitige Gesichtslähmung", "Lidschluss gestört"],
         conditions=["Fazialisparese (Bell-Lähmung)"],
         technique="Physio: mimisches Training, sanfte Gesichtsmassage.",
         contraindications="Keine Elektrostimulation ohne ärztliche Rücksprache.",
         evidence="gut", tradition="Schulmedizin", pubmed_query="Bell palsy physical therapy",
         claims=[C("Spontanheilung", "Bei idiopathischer Fazialisparese erholen sich die meisten Betroffenen innerhalb von Monaten, Kortison früh verbessert die Prognose.", "gut")]),
    dict(code="n-vagus", name="Vagusnerv", latin="N. vagus", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.02, 1.6, -0.02], [-0.03, 1.5, 0.0], [-0.04, 1.35, 0.02], [-0.03, 1.15, 0.03], [0.0, 1.05, 0.04]]),
         description="X. Hirnnerv, wichtigster Teil des Parasympathikus. Versorgt Herz, Lunge, Verdauung.",
         symptoms=["Herzrasen", "Verdauungsstörungen", "Schluckstörung"],
         conditions=["Vasovagale Synkope", "Gastroparese"],
         technique="Langsame Atmung (Ausatmung länger), Ohrmassage (Concha) – Effekte klein.",
         contraindications="Keine Karotis-Massage durch Laien.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="transcutaneous auricular vagus nerve stimulation systematic review",
         claims=[C("Aurikuläre Vagusstimulation", "Erste Reviews zeigen mögliche Effekte (Schmerz, Stimmung), Studienqualität aber heterogen.", "schwach")]),
    dict(code="n-phrenicus", name="Zwerchfellnerv", latin="N. phrenicus", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.02, 1.52, -0.03], [-0.04, 1.42, 0.02], [-0.06, 1.25, 0.05], [-0.08, 1.12, 0.03]]),
         description="Aus C3–C5 („C3, 4, 5 keeps the diaphragm alive“). Erklärt Schulterschmerz bei Zwerchfell-/Gallenreizung.",
         symptoms=["Schulterschmerz (übertragen)", "Schluckauf", "Atemnot"],
         conditions=["Gallenblasenreizung (rechte Schulter)", "Zwerchfellparese"],
         technique="Atemtherapie, Zwerchfell-Techniken (Physio).",
         contraindications="Unklarer Schulterschmerz mit Bauchsymptomen → ärztlich abklären.",
         evidence="gut", tradition="Schulmedizin", pubmed_query="phrenic nerve referred shoulder pain",
         claims=[C("Übertragener Schmerz", "Schmerz aus Zwerchfell/Gallenblase wird über C3–C5 in die Schulter projiziert – klassisches, gut belegtes Phänomen.", "gut")]),
    dict(code="n-occipitalis-major", name="Großer Hinterhauptsnerv", latin="N. occipitalis major", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.02, 1.53, -0.07], [-0.03, 1.6, -0.1], [-0.03, 1.7, -0.08]]),
         description="Aus C2, durchbohrt die Nackenmuskulatur (Semispinalis, Trapezius).",
         symptoms=["Hinterkopfschmerz", "Einschießender Schmerz zum Scheitel"],
         conditions=["Okzipitalneuralgie", "Zervikogener Kopfschmerz"],
         technique="Subokzipitale Weichteiltechnik, sanft.",
         contraindications="Verdacht auf Instabilität der oberen HWS.",
         evidence="maessig", tradition="Schulmedizin", pubmed_query="occipital neuralgia treatment",
         claims=[]),
    dict(code="n-pudendus", name="Schamnerv", latin="N. pudendus", layer="nerven", color="#2F6FB0",
         paths=bilateral([[-0.03, 0.98, -0.07], [-0.04, 0.9, -0.06], [-0.01, 0.86, 0.0]]),
         description="Aus S2–S4, versorgt Beckenboden. Läuft durch den Alcock-Kanal.",
         symptoms=["Schmerz im Sitzen", "Beckenbodenschmerz"],
         conditions=["Pudendusneuralgie", "Beckenbodendysfunktion"],
         technique="Beckenbodentherapie durch spezialisierte Physios.",
         contraindications="Nur mit spezieller Ausbildung.",
         evidence="schwach", tradition="Schulmedizin", pubmed_query="pudendal neuralgia physiotherapy",
         claims=[]),
]

POINTS = [
    dict(code="li4-hegu", name="Hegu (Di 4)", latin="LI4", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.315, 0.8, 0.02], [0.315, 0.8, 0.02]],
         description="Zwischen Daumen und Zeigefinger auf dem Handrücken, höchste Stelle des Muskels.",
         symptoms=["Zahnschmerz", "Kopfschmerz", "Gesichtsschmerz"],
         conditions=["Zahnschmerz", "Spannungskopfschmerz"],
         technique="1–2 Min. fester, kreisender Druck, bis ein dumpfes Ziehen spürbar ist.",
         contraindications="Schwangerschaft (traditionell kontraindiziert).",
         evidence="maessig", pubmed_query="LI4 acupressure dental pain",
         claims=[C("Zahnschmerz", "Einige randomisierte Studien zeigen Schmerzreduktion bei Zahnbehandlung; Qualität gemischt.", "maessig", "TCM")]),
    dict(code="pc6-neiguan", name="Neiguan (Pe 6)", latin="PC6", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.28, 0.92, 0.05], [0.28, 0.92, 0.05]],
         description="3 Querfinger oberhalb der Handgelenksfalte, zwischen den beiden Beugesehnen.",
         symptoms=["Übelkeit", "Erbrechen", "Reiseübelkeit"],
         conditions=["Postoperative Übelkeit", "Schwangerschaftsübelkeit"],
         technique="2–3 Min. Druck, ggf. Akupressurband.",
         contraindications="Liegt über dem N. medianus – nicht übermäßig fest drücken.",
         evidence="gut", pubmed_query="PC6 acupoint stimulation postoperative nausea Cochrane",
         claims=[C("Übelkeit", "Cochrane-Review: PC6-Stimulation reduziert postoperative Übelkeit und Erbrechen im Vergleich zu Schein-Behandlung.", "gut", "TCM")]),
    dict(code="ht7-shenmen", name="Shenmen (He 7)", latin="HT7", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.3, 0.87, 0.04], [0.3, 0.87, 0.04]],
         description="Handgelenksfalte, Kleinfingerseite, radial der Sehne des M. flexor carpi ulnaris.",
         symptoms=["Unruhe", "Schlafstörungen", "Angst"], conditions=["Insomnie"],
         technique="Sanfter Druck 1–2 Min. abends.", contraindications="Keine bekannt.",
         evidence="schwach", pubmed_query="HT7 acupressure sleep quality", claims=[]),
    dict(code="st36-zusanli", name="Zusanli (Ma 36)", latin="ST36", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.12, 0.44, 0.06], [0.12, 0.44, 0.06]],
         description="4 Querfinger unterhalb der Kniescheibe, 1 Querfinger seitlich der Schienbeinkante.",
         symptoms=["Verdauungsbeschwerden", "Erschöpfung", "Knieschmerz"], conditions=["Reizdarm", "Postoperativer Ileus"],
         technique="Kräftiger Druck 2–3 Min.", contraindications="Keine bekannt.",
         evidence="schwach", pubmed_query="Zusanli ST36 acupressure", claims=[]),
    dict(code="sp6-sanyinjiao", name="Sanyinjiao (MP 6)", latin="SP6", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.08, 0.15, 0.02], [0.08, 0.15, 0.02]],
         description="4 Querfinger oberhalb des Innenknöchels, hinter der Schienbeinkante.",
         symptoms=["Regelschmerz", "Unruhe"], conditions=["Dysmenorrhoe"],
         technique="Druck 1–3 Min.", contraindications="Schwangerschaft (traditionell kontraindiziert).",
         evidence="maessig", pubmed_query="SP6 acupressure dysmenorrhea", claims=[C("Regelschmerz", "Mehrere RCTs/Reviews: moderate Schmerzlinderung bei primärer Dysmenorrhoe.", "maessig", "TCM")]),
    dict(code="lr3-taichong", name="Taichong (Le 3)", latin="LR3", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.1, 0.03, 0.1], [0.1, 0.03, 0.1]],
         description="Fußrücken zwischen 1. und 2. Mittelfußknochen.",
         symptoms=["Kopfschmerz", "Reizbarkeit", "Bluthochdruck"], conditions=["Migräne"],
         technique="Druck 1–2 Min.", contraindications="Keine bekannt.",
         evidence="schwach", pubmed_query="LR3 Taichong acupuncture", claims=[]),
    dict(code="ki1-yongquan", name="Yongquan (Ni 1)", latin="KI1", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.1, 0.005, 0.07], [0.1, 0.005, 0.07]],
         description="Fußsohle, vorderes Drittel in der Vertiefung beim Zehenbeugen.",
         symptoms=["Schlafstörung", "Schwindel"], conditions=["Insomnie"], technique="Kreisender Druck.", contraindications="Offene Wunden.",
         evidence="traditionell", pubmed_query="Yongquan acupoint", claims=[]),
    dict(code="gb20-fengchi", name="Fengchi (Gb 20)", latin="GB20", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.04, 1.56, -0.08], [0.04, 1.56, -0.08]],
         description="Unter dem Hinterhaupt in der Grube zwischen M. trapezius und M. sternocleidomastoideus. Nahe N. occipitalis major/minor.",
         symptoms=["Kopfschmerz", "Nackenverspannung", "Schwindel"], conditions=["Spannungskopfschmerz", "Zervikogener Kopfschmerz"],
         technique="Mit Daumen nach oben in Richtung Schädelbasis drücken, 1–2 Min.", contraindications="Instabilität obere HWS.",
         evidence="maessig", pubmed_query="GB20 acupressure headache", related=["n-occipitalis-major"], claims=[]),
    dict(code="gb21-jianjing", name="Jianjing (Gb 21)", latin="GB21", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.12, 1.45, -0.02], [0.12, 1.45, -0.02]],
         description="Höchster Punkt des Schultermuskels (Trapezius), Mitte zwischen HWS und Schulterhöhe. Deckt sich oft mit Trapezius-Triggerpunkt.",
         symptoms=["Schulter-Nacken-Schmerz"], conditions=["Myofasziales Schmerzsyndrom"],
         technique="Muskel zwischen Daumen und Fingern greifen und halten.", contraindications="Schwangerschaft (traditionell).",
         evidence="schwach", pubmed_query="GB21 Jianjing trapezius", related=["trp-trapezius"], claims=[]),
    dict(code="gb30-huantiao", name="Huantiao (Gb 30)", latin="GB30", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.12, 0.9, -0.08], [0.12, 0.9, -0.08]],
         description="Gesäß, zwischen Trochanter major und Kreuzbein – liegt über dem Verlauf des N. ischiadicus / M. piriformis. Wichtiger Becken-/Hüftpunkt des Gallenblasen-Meridians.",
         symptoms=["Hüftschmerz", "Ischias"], conditions=["Ischialgie", "Piriformis-Syndrom"],
         technique="Ellbogen oder Daumen, langsamer tiefer Druck.", contraindications="Hüftprothese frisch.",
         evidence="schwach", pubmed_query="Huantiao GB30 sciatica", related=["n-ischiadicus", "trp-piriformis"], claims=[]),
    dict(code="bl23-shenshu", name="Shenshu (Bl 23)", latin="BL23", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.04, 1.05, -0.1], [0.04, 1.05, -0.1]],
         description="Höhe L2, 2 Querfinger seitlich der Dornfortsätze.", symptoms=["Kreuzschmerz"], conditions=["Chronischer LWS-Schmerz"],
         technique="Flächiger Druck/Reiben.", contraindications="Nierenerkrankung akut.",
         evidence="schwach", pubmed_query="acupressure chronic low back pain", claims=[]),
    dict(code="bl40-weizhong", name="Weizhong (Bl 40)", latin="BL40", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.1, 0.5, -0.05], [0.1, 0.5, -0.05]],
         description="Mitte der Kniekehle. Über N. tibialis und A. poplitea – nur sanft!", symptoms=["Rückenschmerz"], conditions=["LWS-Syndrom"],
         technique="Sehr sanfter Druck.", contraindications="Krampfadern, Thrombose.",
         evidence="traditionell", pubmed_query="BL40 Weizhong low back pain", claims=[]),
    dict(code="gv20-baihui", name="Baihui (LG 20)", latin="GV20", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[0, 1.73, 0]], description="Scheitelpunkt, Verbindungslinie der Ohrspitzen.",
         symptoms=["Kopfschmerz", "Konzentrationsstörung"], conditions=["Stress"], technique="Sanfter Druck/Klopfen.", contraindications="Keine bekannt.",
         evidence="traditionell", pubmed_query="GV20 Baihui acupuncture", claims=[]),
    dict(code="st6-jiache", name="Jiache (Ma 6)", latin="ST6", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.08, 1.56, 0.03], [0.08, 1.56, 0.03]],
         description="Am Kieferwinkel auf dem Masseter (beim Zubeißen tastbar).",
         symptoms=["Zahnschmerz Unterkiefer", "Kiefersperre", "Zähneknirschen"], conditions=["CMD", "Bruxismus"],
         technique="Kreisender Druck bei entspanntem Kiefer.", contraindications="Akute Zahnentzündung.",
         evidence="schwach", pubmed_query="acupuncture temporomandibular disorder", related=["trp-masseter", "n-trigeminus-v3"], claims=[]),
    dict(code="li20-yingxiang", name="Yingxiang (Di 20)", latin="LI20", layer="druckpunkte", tradition="TCM", color="#D96C50",
         positions=[[-0.02, 1.61, 0.1], [0.02, 1.61, 0.1]], description="Neben dem Nasenflügel in der Nasolabialfalte.",
         symptoms=["Verstopfte Nase", "Oberkiefer-Zahnschmerz"], conditions=["Rhinitis"], technique="Sanfter Druck 1 Min.", contraindications="Keine bekannt.",
         evidence="schwach", pubmed_query="acupressure allergic rhinitis", claims=[]),
    dict(code="marma-sthapani", name="Sthapani-Marma", latin="Sthapani", layer="druckpunkte", tradition="Ayurveda", color="#795548",
         positions=[[0, 1.66, 0.1]], description="Ayurveda-Vitalpunkt zwischen den Augenbrauen (entspricht TCM Yintang).",
         symptoms=["Unruhe", "Kopfschmerz"], conditions=["Stress"], technique="Sanftes Kreisen mit Öl.", contraindications="Keine bekannt.",
         evidence="traditionell", pubmed_query="marma therapy", claims=[C("Ayurveda", "Marma-Punkte stammen aus der Sushruta Samhita; moderne Studien sind kaum vorhanden.", "traditionell", "Ayurveda")]),
    dict(code="marma-talahridaya", name="Talahridaya-Marma", latin="Talahridaya", layer="druckpunkte", tradition="Ayurveda", color="#795548",
         positions=[[-0.305, 0.79, 0.06], [0.305, 0.79, 0.06]], description="Mitte der Handinnenfläche („Herz der Hand“).",
         symptoms=["Atemenge", "Unruhe"], conditions=["Stress"], technique="Daumendruck kreisend.", contraindications="Keine bekannt.",
         evidence="traditionell", pubmed_query="marma point stimulation", claims=[]),
    dict(code="trp-masseter", name="Masseter-Triggerpunkt", latin="M. masseter TrP", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.08, 1.58, 0.045], [0.08, 1.58, 0.045]],
         description="Myofaszialer Triggerpunkt (Travell & Simons) im Kaumuskel. Überträgt Schmerz in Ober- und Unterkieferzähne, Ohr und Schläfe.",
         symptoms=["Zahnschmerz ohne Zahnbefund", "Ohrdruck", "Kieferschmerz"], conditions=["CMD", "Bruxismus"],
         technique="Ischämische Kompression 60–90 s, intraoral nur durch geschulte Therapeuten.", contraindications="Akute Entzündung.",
         evidence="maessig", pubmed_query="masseter trigger point referred tooth pain", related=["n-trigeminus-v3"], claims=[]),
    dict(code="trp-scm", name="Sternocleidomastoideus-Triggerpunkt", latin="M. SCM TrP", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.05, 1.5, 0.04], [0.05, 1.5, 0.04]], description="Überträgt Schmerz in Stirn, Auge, Ohr; Schwindel möglich.",
         symptoms=["Stirnkopfschmerz", "Schwindel"], conditions=["Zervikogener Kopfschmerz"], technique="Muskel im Zangengriff halten.", contraindications="Karotis nicht komprimieren.",
         evidence="schwach", pubmed_query="sternocleidomastoid trigger point headache", claims=[]),
    dict(code="trp-trapezius", name="Trapezius-Triggerpunkt", latin="M. trapezius TrP1", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.1, 1.44, -0.05], [0.1, 1.44, -0.05]], description="Häufigster Triggerpunkt; überträgt Schmerz zur seitlichen Hals- und Kopfseite.",
         symptoms=["Nackenschmerz", "Schläfenkopfschmerz"], conditions=["Myofasziales Schmerzsyndrom"], technique="Ischämische Kompression, Dehnung.", contraindications="Keine bekannt.",
         evidence="maessig", pubmed_query="upper trapezius trigger point ischemic compression", claims=[]),
    dict(code="trp-quadratus-lumborum", name="Quadratus-lumborum-Triggerpunkt", latin="M. QL TrP", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.07, 1.04, -0.08], [0.07, 1.04, -0.08]], description="Verbindet Becken mit 12. Rippe und LWS; Verspannung kann Beckenschiefstand vortäuschen.",
         symptoms=["Kreuzschmerz einseitig", "Schmerz Beckenkamm"], conditions=["Funktioneller Beckenschiefstand"], technique="Seitlage, Druck von lateral.", contraindications="Nierenerkrankung.",
         evidence="schwach", pubmed_query="quadratus lumborum trigger point low back pain", claims=[]),
    dict(code="trp-gluteus-medius", name="Gluteus-medius-Triggerpunkt", latin="M. gluteus medius TrP", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.13, 0.95, -0.06], [0.13, 0.95, -0.06]], description="Stabilisiert das Becken im Einbeinstand.",
         symptoms=["Hüft-/Gesäßschmerz", "Schmerz beim Liegen auf der Seite"], conditions=["Trochanter-Schmerzsyndrom"], technique="Daumen-/Ellbogendruck.", contraindications="Bursitis akut.",
         evidence="schwach", pubmed_query="gluteus medius trigger point", claims=[]),
    dict(code="trp-piriformis", name="Piriformis-Triggerpunkt", latin="M. piriformis TrP", layer="druckpunkte", tradition="Manuelle Therapie", color="#839E8C",
         positions=[[-0.08, 0.9, -0.1], [0.08, 0.9, -0.1]], description="Der Ischiasnerv verläuft unter (selten durch) den Piriformis – Verspannung kann ihn reizen.",
         symptoms=["Gesäßschmerz", "Ischias-ähnliche Ausstrahlung"], conditions=["Piriformis-Syndrom"], technique="Tiefer, langsamer Druck + Dehnung (Hüfte Flexion/Adduktion/Innenrotation).", contraindications="Echte Radikulopathie mit Ausfällen.",
         evidence="schwach", pubmed_query="piriformis syndrome conservative treatment review", related=["n-ischiadicus"], claims=[]),
    dict(code="reflex-fuss-kiefer", name="Fußreflexzone Kiefer/Zähne", latin="Reflexzone", layer="druckpunkte", tradition="Reflexzonentherapie", color="#795548",
         positions=[[-0.105, 0.03, 0.125], [0.105, 0.03, 0.125]], description="Nach Fitzgerald/Ingham an den Zehengrundgelenken; keine anatomische Nervenverbindung nachgewiesen.",
         symptoms=["Zahnschmerz"], conditions=["Zahnschmerz"], technique="Kreisender Daumendruck.", contraindications="Thrombose, Fußverletzung.",
         evidence="traditionell", pubmed_query="reflexology systematic review", claims=[C("Reflexzonen", "Systematische Reviews finden keine überzeugende Evidenz für spezifische Fernwirkungen; Entspannungseffekte möglich.", "schwach", "Reflexzonentherapie")]),
]

MERIDIANS = [
    ("meridian-magen", "Magen-Meridian (Ma)", "#E8A33D", [[-0.04, 1.6, 0.09], [-0.06, 1.5, 0.06], [-0.08, 1.3, 0.1], [-0.08, 1.1, 0.1], [-0.08, 0.95, 0.08], [-0.11, 0.7, 0.08], [-0.12, 0.44, 0.06], [-0.11, 0.15, 0.05], [-0.11, 0.03, 0.12]],
     "Beginnt unter dem Auge, zieht über Oberkiefer (Zähne!), Brust, Bauch, Oberschenkel vorn bis zur 2. Zehe.", ["st6-jiache", "st36-zusanli"]),
    ("meridian-gallenblase", "Gallenblasen-Meridian (Gb)", "#6BA368", [[-0.08, 1.66, 0.06], [-0.09, 1.62, -0.04], [-0.04, 1.56, -0.08], [-0.12, 1.45, -0.02], [-0.15, 1.2, 0.0], [-0.14, 0.95, -0.04], [-0.12, 0.9, -0.08], [-0.14, 0.7, 0.0], [-0.12, 0.45, 0.0], [-0.12, 0.1, 0.02], [-0.12, 0.02, 0.1]],
     "Seitlicher Meridian: Auge – Schläfe – Nacken – Schulter – Flanke – Hüfte/Becken (Gb 30) – Bein außen. In der TCM mit Leber gekoppelt; das Zahn-Organ-Schema ordnet ihm die Eckzähne zu.", ["gb20-fengchi", "gb21-jianjing", "gb30-huantiao"]),
    ("meridian-blase", "Blasen-Meridian (Bl)", "#3D8FB5", [[-0.02, 1.67, 0.09], [-0.03, 1.73, 0.0], [-0.03, 1.6, -0.1], [-0.04, 1.4, -0.1], [-0.04, 1.05, -0.1], [-0.08, 0.85, -0.1], [-0.1, 0.5, -0.05], [-0.1, 0.15, -0.04], [-0.12, 0.02, 0.0]],
     "Längster Meridian: innerer Augenwinkel über Kopf und Rücken bis zum kleinen Zeh. Verläuft ähnlich wie die „oberflächliche Rückenlinie“.", ["bl23-shenshu", "bl40-weizhong"]),
    ("meridian-dickdarm", "Dickdarm-Meridian (Di)", "#B56B3D", [[-0.315, 0.74, 0.03], [-0.315, 0.8, 0.02], [-0.28, 1.0, 0.01], [-0.25, 1.13, 0.0], [-0.2, 1.42, 0.0], [-0.05, 1.5, 0.05], [-0.02, 1.61, 0.1]],
     "Zeigefinger – Arm außen – Schulter – Hals – Unterkiefer/Zähne – Nasenflügel. Erklärt traditionell, warum Hegu bei Zahnschmerz genutzt wird.", ["li4-hegu", "li20-yingxiang"]),
    ("meridian-leber", "Leber-Meridian (Le)", "#2E8B57", [[-0.1, 0.03, 0.1], [-0.08, 0.15, 0.02], [-0.07, 0.5, 0.03], [-0.05, 0.9, 0.06], [-0.09, 1.15, 0.09]],
     "Große Zehe – Bein innen – Leiste/Becken – Rippenbogen. Gekoppelt mit Gallenblase; Zahn-Organ-Schema: Eckzähne.", ["lr3-taichong"]),
]
MERIDIAN_ENTRIES = [
    dict(code=c, name=n, latin=c.split("-")[1].upper(), layer="meridiane", tradition="TCM", color=col,
         paths=[p, mirror(p)], description=d, symptoms=[], conditions=[],
         technique="Ausstreichen entlang des Verlaufs (Tuina) oder Punktdruck.", contraindications="",
         evidence="traditionell", pubmed_query="acupuncture meridian anatomical basis fascia", related=rel,
         claims=[C("Anatomische Basis", "Meridiane sind keine nachgewiesenen anatomischen Strukturen. Einige Arbeiten zeigen Überlappungen mit Faszienzügen und Nervenverläufen.", "schwach", "TCM")])
    for c, n, col, p, d, rel in MERIDIANS
] + [dict(code="meridian-lenkergefaess", name="Lenkergefäß (LG)", latin="GV", layer="meridiane", tradition="TCM", color="#8E5BA8",
          paths=[[[0, 0.92, -0.08], [0, 1.2, -0.1], [0, 1.55, -0.09], [0, 1.73, 0], [0, 1.62, 0.1]]],
          description="Mittellinie Rücken: Steißbein – Wirbelsäule – Scheitel – Oberlippe.", symptoms=[], conditions=[],
          technique="Ausstreichen entlang der Wirbelsäule.", contraindications="", evidence="traditionell",
          pubmed_query="governor vessel acupuncture", related=["gv20-baihui"], claims=[])]

CHAINS = [
    dict(code="kette-zahn13-becken", name="Kette: Zahn 13 → Kiefer → HWS → Becken", latin="Hypothese", layer="ketten", tradition="Manuelle Therapie / Ganzheitlich", color="#D96C50",
         paths=[[[-0.03, 1.6, 0.08], [-0.08, 1.57, 0.03], [-0.05, 1.5, 0.02], [-0.03, 1.45, -0.06], [-0.05, 1.2, -0.09], [-0.07, 1.04, -0.08], [-0.12, 0.92, -0.06]]],
         description="Warum soll ein fehlender oberer rechter Eckzahn das Becken beeinflussen? Die Erklärungskette: (1) Ohne Eckzahn fehlt die Eckzahnführung → veränderte Seitwärtsbewegung des Unterkiefers, einseitiges Kauen. (2) Asymmetrische Kaumuskelaktivität (Masseter/Temporalis) → CMD-Symptome. (3) Trigemino-zervikaler Komplex & Kopfhaltung → obere HWS. (4) Muskel-/Faszienketten (SCM, Rückenstrecker, Quadratus lumborum) → funktioneller Beckenschiefstand. Umgekehrt (aufsteigend) kann auch das Becken den Kiefer beeinflussen.",
         symptoms=["Einseitiger Kiefer-/Nackenschmerz", "Kopfschmerz", "Beckenschiefstand (funktionell)"],
         conditions=["CMD", "Zervikogener Kopfschmerz", "Funktionelle Beinlängendifferenz"],
         technique="Interdisziplinär: Zahnarzt/Kieferorthopäde + Physio. Prüfen: Okklusion, HWS, Becken (Vorlauf-/Stehtest).",
         contraindications="Strukturelle Ursachen (echte Beinlängendifferenz, Skoliose) ausschließen.",
         evidence="schwach", pubmed_query="dental occlusion body posture systematic review", related=["zahn-13", "trp-masseter", "trp-scm", "trp-quadratus-lumborum", "n-trigeminus-v2"],
         claims=[C("Neuroanatomie", "Trigemino-zervikale Konvergenz ist gut belegt.", "gut"),
                 C("Okklusion ↔ Körperhaltung", "Systematische Reviews finden KEINEN gesicherten kausalen Zusammenhang zwischen Okklusion und Becken/Körperhaltung; Einzelstudien widersprüchlich.", "schwach"),
                 C("TCM-Sicht", "Eckzahn ↔ Leber/Gallenblasen-Meridian, dessen Verlauf über die Hüfte (Gb 30) zieht.", "traditionell", "TCM")]),
    dict(code="kette-rueckenlinie", name="Oberflächliche Rückenlinie (Faszienkette)", latin="Anatomy Trains SBL", layer="ketten", tradition="Manuelle Therapie", color="#839E8C",
         paths=bilateral([[-0.02, 1.67, 0.08], [-0.03, 1.7, -0.05], [-0.03, 1.55, -0.1], [-0.04, 1.2, -0.1], [-0.04, 0.95, -0.1], [-0.08, 0.75, -0.09], [-0.1, 0.5, -0.05], [-0.1, 0.25, -0.06], [-0.1, 0.0, -0.03], [-0.1, 0.0, 0.08]]),
         description="Myofasziale Kontinuität von Fußsohle über Wade, Oberschenkelrückseite, Kreuzbein, Rückenstrecker bis zur Stirn (nach T. Myers).",
         symptoms=["Verkürzte Rückseite", "Rücken-/Nackenschmerz"], conditions=["Hohlkreuz/Flachrücken"],
         technique="Faszienbehandlung, Dehnung der gesamten Kette.", contraindications="",
         evidence="maessig", pubmed_query="myofascial chains anatomy trains systematic review", related=["meridian-blase"],
         claims=[C("Anatomische Kontinuität", "Ein systematischer Review fand starke Evidenz für die Kontinuität der oberflächlichen Rückenlinie in Leichenstudien; funktionelle Kraftübertragung weniger klar.", "maessig")]),
]

TOOTH_NAMES = {1: "mittlerer Schneidezahn", 2: "seitlicher Schneidezahn", 3: "Eckzahn", 4: "erster Prämolar",
               5: "zweiter Prämolar", 6: "erster Molar", 7: "zweiter Molar", 8: "Weisheitszahn"}
QUAD = {1: ("oben rechts", True, -1), 2: ("oben links", True, 1), 3: ("unten links", False, 1), 4: ("unten rechts", False, -1)}

VOLL = {  # traditionelles Zahn-Organ-Schema (Voll/Kramer, vereinfacht)
    "12": ("Niere / Blase", "Ohr, Stirnhöhle", "Iliosakralgelenk, Knie hinten, Sprunggelenk", "L2–L3, S3–Co"),
    "3": ("Leber / Gallenblase", "Auge", "Hüfte, Knie hinten", "Th8–Th10"),
    "U45": ("Lunge / Dickdarm", "Nase, Siebbeinzellen", "Schulter, Ellbogen, Hand radial, Großzehe", "C5–C7, Th2–Th4, L4–L5"),
    "U67": ("Magen / Milz-Pankreas", "Kieferhöhle", "Kiefergelenk, Hüfte vorn, Knie vorn", "Th11–Th12, L1"),
    "L45": ("Magen / Milz-Pankreas", "Kieferhöhle", "Kiefergelenk, Hüfte vorn, Knie vorn", "Th11–Th12, L1"),
    "L67": ("Lunge / Dickdarm", "Siebbeinzellen", "Schulter, Ellbogen, Fuß", "C5–C7, Th2–Th4, L4–L5"),
    "8": ("Herz / Dünndarm", "Ohr, Zunge", "Schulter-Arm ulnar, Kreuzbein, Fuß plantar", "C7, Th1, Th5–Th7, S1–S2"),
}

AGENESIS = {
    1: "Aplasie mittlerer Schneidezähne ist sehr selten. Folge: Lücke, Mittellinienverschiebung, ästhetische und phonetische Probleme.",
    2: "Häufig (zweithäufigste Nichtanlage, ca. 1–2 %). Folge: Lücke oder Eckzahn wandert nach vorn; oft Kombination mit verlagerten Eckzähnen.",
    3: "Sehr selten (unter 0,5 %). Folge: Persistierender Milcheckzahn oder Lücke, FEHLENDE ECKZAHNFÜHRUNG → Gruppenführung, veränderte Laterotrusion, oft einseitiges Kaumuster, Mittellinienverschiebung. Funktionelle Hypothese: Kiefer → HWS → Becken (siehe Kette).",
    4: "Selten. Folge: Lücke, Kippung der Nachbarzähne, veränderte Okklusion.",
    5: "Häufigste Nichtanlage nach Weisheitszähnen (v. a. unten, ca. 2–3 %). Milchmolar bleibt oft lange stehen, Infraokklusion möglich.",
    6: "Extrem selten. Bei Verlust: Kippung, Elongation des Gegenzahns, Bisssenkung.",
    7: "Selten. Folge: Elongation Gegenzahn, veränderte Abstützung.",
    8: "Sehr häufig (20–30 % der Menschen). Meist ohne funktionelle Folgen.",
}


def tooth_pos(q, i):
    upper, sign = QUAD[q][1], QUAD[q][2]
    t = math.radians((i - 0.5) / 8 * 95)
    x = sign * 0.034 * math.sin(t)
    z = 0.032 + 0.05 * math.cos(t)
    y = 1.597 if upper else 1.577
    return [round(x, 4), y, round(z, 4)]


def tooth_entries():
    out = []
    for q in (1, 2, 3, 4):
        side, upper, _ = QUAD[q]
        for i in range(1, 9):
            fdi = f"{q}{i}"
            if upper:
                nerve = ("N. alveolaris superior anterior" if i <= 3 else "N. alveolaris superior medius (inkonstant, sonst posterior)" if i <= 5 else "N. alveolaris superior posterior")
                if i == 3:
                    nerve = "N. alveolaris superior anterior (oft zusätzlich medius)"
                branch, rel = "N. maxillaris (V2)", "n-trigeminus-v2"
                gum = "Palatinal: N. nasopalatinus" if i <= 3 else "Palatinal: N. palatinus major"
                key = "12" if i <= 2 else "3" if i == 3 else "U45" if i <= 5 else "U67" if i <= 7 else "8"
            else:
                nerve = "N. alveolaris inferior" + (" (R. incisivus)" if i <= 3 else "")
                branch, rel = "N. mandibularis (V3)", "n-trigeminus-v3"
                gum = "Lingual: N. lingualis; bukkal: " + ("N. mentalis" if i <= 5 else "N. buccalis")
                key = "12" if i <= 2 else "3" if i == 3 else "L45" if i <= 5 else "L67" if i <= 7 else "8"
            organ, sense, joints, verts = VOLL[key]
            related = [rel, "meridian-gallenblase" if i == 3 else "meridian-magen" if upper else "meridian-dickdarm"]
            if i == 3 and q == 1:
                related.insert(0, "kette-zahn13-becken")
            out.append(dict(
                code=f"zahn-{fdi}", name=f"Zahn {fdi} – {TOOTH_NAMES[i]} {side}", latin=f"FDI {fdi}", layer="zaehne",
                tradition="Schulmedizin + TCM", color="#F5F1E6", fdi=fdi, positions=[tooth_pos(q, i)],
                description=f"Innervation: {nerve} aus dem {branch}. {gum}.",
                symptoms=["Zahnschmerz", "Kälte-/Wärmeempfindlichkeit"] + (["Ausstrahlung Schläfe/Ohr"] if i >= 6 else []),
                conditions=["Karies/Pulpitis", "Parodontitis"] + (["Nichtanlage (Hypodontie)"] if i in (2, 3, 5, 8) else []),
                technique="Bei Zahnschmerz: Zahnarzt. Begleitend: Masseter-/Temporalis-Entspannung, Hegu (Di 4).",
                contraindications="Akuter Abszess, Schwellung, Fieber → sofort Zahnarzt.",
                evidence="gut", pubmed_query="maxillary canine agenesis" if i == 3 else "tooth agenesis prevalence meta-analysis",
                related=related, agenesis=AGENESIS[i],
                tcm={"organ": organ, "sinnesorgan": sense, "gelenke": joints, "wirbel": verts},
                claims=[
                    C("Innervation", f"{nerve} → {branch} → Ganglion trigeminale → Hirnstamm / trigemino-zervikaler Komplex.", "gut"),
                    C("Nichtanlage (Hypodontie)", AGENESIS[i], "gut" if i != 3 else "maessig"),
                    C("Zahn-Organ-Schema (Voll/Kramer)", f"Meridian/Organ: {organ}; Sinnesorgan: {sense}; Gelenke: {joints}; Wirbel: {verts}. Empirisch nicht belegt.", "traditionell", "TCM / Elektroakupunktur nach Voll"),
                ]))
    return out


# Original coordinates were drafted on the simplified body; warp them onto BodyParts3D anatomy.
Y_SRC = [0.0, 0.08, 0.5, 0.92, 1.42, 1.51, 1.597, 1.62, 1.73]
Y_DST = [0.0, 0.06, 0.45, 0.92, 1.41, 1.49, 1.545, 1.6, 1.72]
TOOTH_POS = json.loads((Path(__file__).parent / "data" / "tooth_positions.json").read_text())
# Arm nerves traced from BodyParts3D meshes (left side, mirrored) + hand extension
ARM_PATHS = json.loads((Path(__file__).parent / "data" / "arm_nerve_paths.json").read_text())
HAND_END = {"n-medianus": [0.27, 0.8, 0.05], "n-ulnaris": [0.28, 0.79, 0.03], "n-radialis": [0.285, 0.83, 0.02]}


def warp(p):
    x, y, z = p
    ny = float(np.interp(y, Y_SRC, Y_DST))
    if y > 1.47:
        x *= 0.72
    elif abs(x) > 0.24 and y < 0.95:
        x *= 0.93
        ny += 0.035 * min(1.0, max(0.0, (0.95 - y) / 0.1))
    return [round(x, 4), round(ny, 4), z]


def all_entries():
    entries = copy.deepcopy(NERVES + POINTS + MERIDIAN_ENTRIES + CHAINS) + tooth_entries()
    for e in entries:
        if e.get("fdi"):
            e["positions"] = [TOOTH_POS[e["fdi"]]]
        elif e["code"] in ARM_PATHS:
            left = ARM_PATHS[e["code"]] + [HAND_END[e["code"]]]
            e["paths"] = [mirror(left), left]
        else:
            if e.get("positions"):
                e["positions"] = [warp(p) for p in e["positions"]]
            if e.get("paths"):
                e["paths"] = [[warp(p) for p in path] for path in e["paths"]]
        e.setdefault("related", [])
        e.setdefault("positions", None)
        e.setdefault("paths", None)
        e.setdefault("studies", [])
    return entries
