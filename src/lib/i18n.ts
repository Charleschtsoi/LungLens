import { CONDITION_DESCRIPTIONS } from "@/lib/constants";
import type { FindingLabel } from "@/types";
import type { Locale } from "@/store/useLocaleStore";

type Dict = Record<string, string>;

const dictEn: Dict = {
  "nav.home": "Home",
  "nav.upload": "Upload",
  "nav.learn": "Learn",
  "nav.about": "About",
  "nav.language": "Language",
  "lang.en": "EN",
  "lang.hant": "繁中",
  "lang.hans": "简中",

  "footer.important": "Important",
  "footer.permanent":
    "Permanent notice: LungLens is for education only. It does not diagnose disease, interpret your scan as a clinician would, or replace advice from your doctor or radiologist.",
  "footer.extra":
    "LungLens does not replace professional medical judgment. For emergencies, call your local emergency number. Imaging interpretation belongs to your licensed care team.",
  "footer.copy": "Educational use only",

  "landing.hero.badge": "Chest X-ray education companion",
  "landing.hero.title": "Understand Your Chest X-Ray",
  "landing.hero.subtitle":
    "Already have your X-ray results? Let us help you learn what you're looking at.",
  "landing.hero.ctaUpload": "Upload Your X-Ray",
  "landing.hero.ctaLearn": "Learn about chest X-rays",
  "landing.hero.trust": "Your images never leave your device",

  "landing.how.title": "How it works",
  "landing.how.subtitle":
    "Three calm steps from your clinic's imaging to clearer understanding.",
  "landing.how.step1.title": "Visit your doctor & get your X-ray",
  "landing.how.step1.body":
    "Obtain your imaging through normal care-after a checkup, visit, or follow-up.",
  "landing.how.step2.title": "Upload your image for educational analysis",
  "landing.how.step2.body":
    "Bring your JPEG or PNG here for anatomy context and plain-language guidance-not a diagnosis.",
  "landing.how.step3.title": "Understand your results & ask smarter questions",
  "landing.how.step3.body":
    "Explore what you're seeing and take better questions back to your clinician.",
  "landing.how.step": "Step",

  "landing.expect.title": "Set expectations",
  "landing.expect.subtitle":
    "A clear line between education and medical decision-making.",
  "landing.expect.does": "What this tool does",
  "landing.expect.not": "What this tool does not do",
  "landing.expect.does.1": "Explain anatomy and common terms in plain language",
  "landing.expect.does.2":
    "Show where an educational model focuses attention on your image",
  "landing.expect.does.3":
    "Suggest questions you might ask your doctor or radiology team",
  "landing.expect.does.4":
    "Support health literacy after you already have imaging from care",
  "landing.expect.not.1": "Diagnose pneumonia, cancer, or any condition",
  "landing.expect.not.2": "Replace a radiologist or your treating clinician",
  "landing.expect.not.3":
    "Tell you whether you need treatment or emergency care",
  "landing.expect.not.4":
    "Guarantee completeness or accuracy of any automated output",

  "landing.disclaimer.title": "Medical disclaimer",
  "landing.disclaimer.p1":
    "LungLens is an educational health-literacy tool only. It is not a medical device and does not provide a diagnosis, prognosis, or treatment advice. Always follow the guidance of a qualified healthcare professional and your official radiology report.",
  "landing.disclaimer.p2":
    "If you have chest pain, trouble breathing, fever, or other concerning symptoms, seek appropriate medical care rather than relying on this website.",

  "upload.title": "Upload your X-ray",
  "upload.subtitle":
    "Three quick steps - all on this page. Your answers help us show the right disclaimers.",
  "upload.step1": "Doctor gate",
  "upload.step2": "Privacy",
  "upload.step3": "Upload",
  "upload.step4": "Questionnaire",
  "upload.gate.title":
    "Has a doctor already reviewed your chest X-ray?",
  "upload.gate.desc":
    "We'll tailor disclaimers based on your answer. This app does not replace medical care.",
  "upload.gate.yes": "Yes",
  "upload.gate.no": "No",
  "upload.gate.warnTitle": "We recommend seeing a clinician first",
  "upload.gate.warnBody":
    "We recommend consulting a doctor first. This tool helps you UNDERSTAND results, not replace professional diagnosis.",
  "upload.gate.findDoctor": "Find a doctor near me",
  "upload.gate.continue": "Continue to learn anyway",

  "upload.privacy.title": "Privacy & purpose",
  "upload.privacy.desc":
    "Your image is sent to this app's secure API for educational analysis. We don't use it for advertising. In a future version, processing may stay entirely on your device-check the latest privacy policy before uploading anything sensitive.",
  "upload.privacy.ack":
    "I understand this is educational, not diagnostic. I will not use LungLens to decide whether I need treatment or emergency care.",
  "upload.privacy.next": "Continue to upload",

  "upload.dicom.title": "DICOM files",
  "upload.dicom.desc":
    "Many browsers can't preview DICOM. If upload fails, export a PNG or JPEG from your hospital portal or CD viewer. Maximum file size: 10MB.",
  "upload.drop.prompt": "Drag & drop your chest X-ray",
  "upload.drop.note": "JPEG, PNG, or DICOM (.dcm) - up to 10MB",
  "upload.preview": "Preview",
  "upload.preview.noInline":
    "DICOM selected - preview not shown in the browser.",
  "upload.preview.noType": "No image preview for this file type.",
  "upload.analyze": "Analyze",
  "upload.analyzing":
    "Our AI is studying your X-ray... (usually takes 5-10 seconds)",
  "upload.fileError.type": "Use JPEG, PNG, or DICOM (.dcm).",
  "upload.fileError.size": "File is larger than 10MB.",
  "upload.q.title": "Clinical questionnaire",
  "upload.q.subtitle":
    "Because findings were positive, please answer a few questions to generate contextual risk guidance.",
  "upload.q.age": "Age",
  "upload.q.fever": "Fever",
  "upload.q.coughDays": "Cough duration (days)",
  "upload.q.smoking": "Smoking status",
  "upload.q.breathing": "Breathing difficulty",
  "upload.q.never": "Never",
  "upload.q.former": "Former",
  "upload.q.current": "Current",
  "upload.q.none": "None",
  "upload.q.mild": "Mild",
  "upload.q.severe": "Severe",
  "upload.q.submit": "Generate final report",

  "results.loading": "Loading results...",
  "results.redirecting": "Redirecting to upload...",
  "results.title": "Your education report",
  "results.subtitle":
    "Explore your image, attention map, and anatomy-then bring questions to your care team.",
  "results.newUpload": "New upload",
  "results.noDoctor":
    "You indicated a doctor has not yet reviewed your X-ray. Please consult a healthcare professional for proper diagnosis.",
  "results.tab.xray": "Your X-Ray",
  "results.tab.attention": "AI Attention Map",
  "results.tab.anatomy": "Anatomy Guide",
  "results.noPreview":
    "Preview not available for this file. Export a PNG or JPEG if you need to view it here.",
  "results.noAttention": "Attention map not available for this run.",
  "results.attentionNote":
    "Warmer or emphasized regions show where the model focused-this is not a finding list and not a substitute for a radiologist.",
  "results.noAttentionReturned": "No attention map returned for this analysis.",
  "results.anatomyPlaceholder":
    "Typical label positions on a standard PA chest film (educational schematic).",
  "results.anatomyHeader": "What the AI noticed",
  "results.anatomySub":
    "Educational model scores-not a diagnosis. Only a radiologist can confirm what your film shows.",
  "results.noSignificant":
    "The AI did not highlight any significant areas. This is generally consistent with a normal chest X-ray, but only a radiologist can confirm.",
  "results.attentionLevel": "Attention level",
  "results.low": "Low",
  "results.moderate": "Moderate",
  "results.high": "High",
  "results.questionsTitle": "Questions to ask your doctor",
  "results.questionsSub":
    "Suggested conversation starters based on this educational output-not medical instructions.",
  "results.copy": "Copy",
  "results.copied": "Copied",
  "results.learnMore": "Learn more",
  "results.learnMoreSub":
    "Short guides on the Learn hub-use them to prepare for conversations with your clinician.",
  "results.basics": "Chest X-ray basics",
  "results.basicsSub":
    "Anatomy, common terms, and how to read your report at a high level",
  "results.topicSub": "Vocabulary, typical context, and questions for your visit",
  "anatomy.trachea": "Trachea",
  "anatomy.heart": "Heart",
  "anatomy.left-lung": "Left lung",
  "anatomy.right-lung": "Right lung",
  "anatomy.diaphragm": "Diaphragm",
  "anatomy.desc.trachea":
    "Midline airway; deviation can have many causes your radiologist comments on.",
  "anatomy.desc.heart":
    "Cardiac silhouette-size and shape are interpreted with your clinical context.",
  "anatomy.desc.left-lung":
    "Appears on the right side of the image in a standard PA view.",
  "anatomy.desc.right-lung":
    "Appears on the left side of the image in a standard PA view.",
  "anatomy.desc.diaphragm":
    "Domed muscle below the lungs; position helps assess lung volume.",
  "results.sticky":
    "LungLens is an educational tool only. This is not a medical diagnosis. Always consult a qualified healthcare professional for medical advice.",

  "learn.title": "Learn about chest X-rays",
  "learn.topicPrefix": "Learn:",
  "learn.desc":
    "Educational hub for anatomy, vocabulary, and how to read your report-without replacing your radiologist.",
  "learn.topicDesc":
    "Placeholder module for this topic. Rich articles and interactives will ship here.",
  "learn.coming": "Coming soon",
  "learn.comingDesc":
    "Interactive diagrams, normal vs. example cases, and short quizzes will complement what you see on your results dashboard.",

  "about.badge": "About LungLens",
  "about.title": "Built to make chest X-ray learning accessible",
  "about.subtitle":
    "LungLens is a medical chest X-ray analysis and education tool designed to help people better understand imaging results in plain language. The focus is health literacy: helping users ask better questions, not replacing professional care.",
  "about.storyTitle": "Project Story",
  "about.storySub": "Research collaboration + independent product build",
  "about.story1":
    "The machine learning model behind LungLens was developed as part of an MSc group project at CUHK Chinese University Hong Kong.",
  "about.story2":
    "I then built this web application independently so the tool could be freely accessible to everyone in a clean, easy-to-use format.",
  "about.team": "Team Credits",
  "about.disclaimerTitle": "Medical Disclaimer",
  "about.disclaimer1": "This tool is for educational and research purposes only.",
  "about.disclaimer2":
    "It is NOT a substitute for professional medical diagnosis.",
  "about.disclaimer3": "Always consult a qualified healthcare professional.",
  "about.stack": "Tech Stack",
  "about.stackModel": "Model: PyTorch, trained on [dataset name, e.g. NIH ChestX-ray14]",
  "about.stackFrontend": "Frontend: Next.js, Tailwind CSS",
  "about.stackDeploy": "Deployment: [Railway / Cloud Run / etc.]",
  "about.contactTitle": "Open Source / Contact",
  "about.contactSub": "Interested in collaboration, feedback, or contributing?",
  "about.github": "View GitHub Repository",
  "about.email": "Email Contact",
  "about.linkedin": "LinkedIn",
};

const dictHant: Dict = {
  "nav.home": "首頁",
  "nav.upload": "上傳",
  "nav.learn": "學習",
  "nav.about": "關於",
  "nav.language": "語言",
  "lang.en": "EN",
  "lang.hant": "繁中",
  "lang.hans": "简中",
  "footer.important": "重要聲明",
  "footer.permanent":
    "永久提示：LungLens 僅供教育用途，並不提供疾病診斷、亦不會取代醫生或放射科醫師的專業判讀。",
  "footer.extra":
    "LungLens 不可取代專業醫療判斷。如遇緊急情況，請立即聯絡當地緊急服務。影像判讀應由持牌醫護團隊進行。",
  "footer.copy": "僅供教育用途",
  "landing.hero.badge": "胸肺 X 光教育夥伴",
  "landing.hero.title": "看懂你的胸肺 X 光",
  "landing.hero.subtitle": "已經有 X 光結果？我們可以幫你理解你正在看的影像內容。",
  "landing.hero.ctaUpload": "上傳你的 X 光",
  "landing.hero.ctaLearn": "了解胸部 X 光",
  "landing.hero.trust": "你的影像不會離開你的裝置",
  "landing.how.title": "如何使用",
  "landing.how.subtitle": "由就診影像到更清晰理解，只需三個步驟。",
  "landing.how.step1.title": "先看醫生並取得 X 光",
  "landing.how.step1.body": "透過正常醫療流程取得影像，例如體檢、門診或覆診。",
  "landing.how.step2.title": "上傳影像進行教育性分析",
  "landing.how.step2.body": "上傳 JPEG 或 PNG，了解解剖位置與一般說明，而非診斷。",
  "landing.how.step3.title": "理解結果並提出更精準問題",
  "landing.how.step3.body": "先看懂重點，再把更好的問題帶回給醫護團隊。",
  "landing.how.step": "步驟",
  "landing.expect.title": "先釐清定位",
  "landing.expect.subtitle": "清楚區分教育用途與醫療決策。",
  "landing.expect.does": "本工具會做什麼",
  "landing.expect.not": "本工具不會做什麼",
  "landing.expect.does.1": "用淺白方式說明解剖與常見術語",
  "landing.expect.does.2": "展示模型在影像上關注的位置",
  "landing.expect.does.3": "提供可向醫生詢問的問題方向",
  "landing.expect.does.4": "幫助已完成就醫者提升健康理解",
  "landing.expect.not.1": "不會診斷肺炎、癌症或其他疾病",
  "landing.expect.not.2": "不會取代放射科醫師或主診醫師",
  "landing.expect.not.3": "不會告訴你是否需要治療或急診",
  "landing.expect.not.4": "不保證自動化輸出的完整性或準確性",
  "landing.disclaimer.title": "醫療免責聲明",
  "landing.disclaimer.p1":
    "LungLens 僅為健康教育工具，並非醫療器材，不提供診斷、預後或治療建議。請以醫護專業人員與正式放射科報告為準。",
  "landing.disclaimer.p2":
    "如有胸痛、呼吸困難、發燒或其他警訊症狀，請立即就醫，不要只依賴本網站。",
  "upload.title": "上傳你的 X 光",
  "upload.subtitle": "同一頁三步驟完成，你的選擇會影響免責提示內容。",
  "upload.step1": "醫師確認",
  "upload.step2": "隱私提示",
  "upload.step3": "上傳影像",
  "upload.step4": "問卷",
  "upload.gate.title": "你的胸肺 X 光是否已由醫生檢視？",
  "upload.gate.desc": "我們會按你的回答顯示不同提示。本工具不取代醫療照護。",
  "upload.gate.yes": "是",
  "upload.gate.no": "否",
  "upload.gate.warnTitle": "建議先由醫護人員評估",
  "upload.gate.warnBody": "我們建議先諮詢醫生。本工具用於理解結果，並不能取代專業診斷。",
  "upload.gate.findDoctor": "尋找附近醫生",
  "upload.gate.continue": "仍要繼續學習",
  "upload.privacy.title": "隱私與用途",
  "upload.privacy.desc":
    "你的影像會傳送到本應用的安全 API 作教育性分析，不會用於廣告。未來版本可能支援完全本地處理，上傳前請先查看最新隱私政策。",
  "upload.privacy.ack": "我明白此工具僅供教育用途，不作診斷，也不會據此決定是否需要治療或急診。",
  "upload.privacy.next": "繼續上傳",
  "upload.dicom.title": "DICOM 檔案",
  "upload.dicom.desc": "不少瀏覽器無法預覽 DICOM。若上傳失敗，請從醫院系統匯出 PNG/JPEG。檔案上限 10MB。",
  "upload.drop.prompt": "拖曳並放下胸肺 X 光",
  "upload.drop.note": "JPEG、PNG 或 DICOM (.dcm)，上限 10MB",
  "upload.preview": "預覽",
  "upload.preview.noInline": "已選擇 DICOM，瀏覽器暫不顯示預覽。",
  "upload.preview.noType": "此檔案類型暫不支援預覽。",
  "upload.analyze": "開始分析",
  "upload.analyzing": "AI 正在分析你的 X 光…（通常需時 5-10 秒）",
  "upload.fileError.type": "請使用 JPEG、PNG 或 DICOM (.dcm)。",
  "upload.fileError.size": "檔案大於 10MB。",
  "upload.q.title": "臨床問卷",
  "upload.q.subtitle": "由於出現陽性線索，請回答幾個問題以產生更完整的風險說明。",
  "upload.q.age": "年齡",
  "upload.q.fever": "是否發燒",
  "upload.q.coughDays": "咳嗽天數",
  "upload.q.smoking": "吸煙狀態",
  "upload.q.breathing": "呼吸困難程度",
  "upload.q.never": "從不",
  "upload.q.former": "曾經",
  "upload.q.current": "目前",
  "upload.q.none": "沒有",
  "upload.q.mild": "輕微",
  "upload.q.severe": "嚴重",
  "upload.q.submit": "產生最終報告",
  "results.loading": "結果載入中…",
  "results.redirecting": "正在返回上傳頁…",
  "results.title": "你的教育報告",
  "results.subtitle": "查看影像、注意力熱圖與解剖提示，再把問題帶回給醫護團隊。",
  "results.newUpload": "重新上傳",
  "results.noDoctor": "你表示尚未有醫生檢視此 X 光。請儘快諮詢醫護人員作正規診斷。",
  "results.tab.xray": "你的 X 光",
  "results.tab.attention": "AI 注意力熱圖",
  "results.tab.anatomy": "解剖導覽",
  "results.noPreview": "此檔案暫無預覽，若需要可轉成 PNG/JPEG 再查看。",
  "results.noAttention": "本次分析沒有提供注意力熱圖。",
  "results.attentionNote": "顏色較強區域代表模型關注位置，並非診斷結果，也不能取代放射科判讀。",
  "results.noAttentionReturned": "本次分析未回傳注意力熱圖。",
  "results.anatomyPlaceholder": "標準 PA 胸部 X 光的常見標記位置（教育示意）。",
  "results.anatomyHeader": "AI 注意到的內容",
  "results.anatomySub": "以下為教育用途分數，不代表診斷，最終仍需由放射科醫師確認。",
  "results.noSignificant": "AI 未標示明顯重點區域。這一般可能接近正常 X 光表現，但仍需放射科醫師確認。",
  "results.attentionLevel": "關注程度",
  "results.low": "低",
  "results.moderate": "中",
  "results.high": "高",
  "results.questionsTitle": "可向醫生提出的問題",
  "results.questionsSub": "以下為對話建議，並非醫療指示。",
  "results.copy": "複製",
  "results.copied": "已複製",
  "results.learnMore": "延伸閱讀",
  "results.learnMoreSub": "到學習頁查看更多主題內容，協助你與醫護人員溝通。",
  "results.basics": "胸部 X 光基礎",
  "results.basicsSub": "解剖、術語與報告閱讀入門",
  "results.topicSub": "名詞解釋、常見情境與門診提問方向",
  "anatomy.trachea": "氣管",
  "anatomy.heart": "心臟",
  "anatomy.left-lung": "左肺",
  "anatomy.right-lung": "右肺",
  "anatomy.diaphragm": "橫膈膜",
  "anatomy.desc.trachea": "中線氣道；若偏移可能有多種原因，需由放射科醫師判讀。",
  "anatomy.desc.heart": "心影大小與形狀需配合臨床狀況解讀。",
  "anatomy.desc.left-lung": "在標準 PA 視圖中，左肺常顯示於影像右側。",
  "anatomy.desc.right-lung": "在標準 PA 視圖中，右肺常顯示於影像左側。",
  "anatomy.desc.diaphragm": "位於肺下方的拱形肌肉，其位置可反映肺容量。",
  "results.sticky": "LungLens 僅供教育用途，並非醫療診斷。請務必諮詢合資格醫護人員。",
  "learn.title": "了解胸肺 X 光",
  "learn.topicPrefix": "主題：",
  "learn.desc": "學習解剖、常見術語與報告閱讀方式，但不取代放射科醫師判讀。",
  "learn.topicDesc": "此主題內容為示意頁，後續將加入更完整教材與互動。",
  "learn.coming": "即將推出",
  "learn.comingDesc": "之後會加入互動解剖圖、正常與案例對照，以及短測驗。",
  "about.badge": "關於 LungLens",
  "about.title": "讓胸肺 X 光學習更普及",
  "about.subtitle":
    "LungLens 是胸部 X 光分析與教育工具，目標是以淺白方式幫助使用者理解影像結果，提升健康素養，而非取代專業醫療判斷。",
  "about.storyTitle": "專案故事",
  "about.storySub": "研究合作 + 獨立產品化",
  "about.story1":
    "LungLens 背後的機器學習模型，源自 CUHK Chinese University Hong Kong 碩士小組專案。",
  "about.story2":
    "其後我獨立開發此網頁應用，讓更多人可以免費使用並更容易理解 X 光資訊。",
  "about.team": "團隊名單",
  "about.disclaimerTitle": "醫療免責聲明",
  "about.disclaimer1": "本工具僅供教育與研究用途。",
  "about.disclaimer2": "本工具不能取代專業醫療診斷。",
  "about.disclaimer3": "請務必諮詢合資格醫護專業人員。",
  "about.stack": "技術棧",
  "about.stackModel": "模型：PyTorch（訓練資料：[dataset name, e.g. NIH ChestX-ray14]）",
  "about.stackFrontend": "前端：Next.js、Tailwind CSS",
  "about.stackDeploy": "部署：[Railway / Cloud Run / etc.]",
  "about.contactTitle": "開源 / 聯絡",
  "about.contactSub": "歡迎交流、回饋或共同貢獻。",
  "about.github": "查看 GitHub 倉庫",
  "about.email": "電郵聯絡",
  "about.linkedin": "LinkedIn",
};

const dictHans: Dict = {
  ...dictHant,
  "nav.home": "首页",
  "nav.upload": "上传",
  "nav.learn": "学习",
  "nav.about": "关于",
  "lang.hant": "繁中",
  "lang.hans": "简中",
  "footer.important": "重要声明",
  "footer.copy": "仅供教育用途",
  "landing.hero.title": "看懂你的胸片结果",
  "landing.hero.subtitle": "已经有 X 光结果？我们可以帮你理解你正在看的影像内容。",
  "landing.how.title": "如何使用",
  "landing.expect.title": "先明确定位",
  "landing.disclaimer.title": "医疗免责声明",
  "upload.title": "上传你的 X 光",
  "upload.step1": "医生确认",
  "upload.step3": "上传影像",
  "upload.step4": "问卷",
  "upload.gate.title": "你的胸片是否已由医生查看？",
  "upload.gate.warnTitle": "建议先由医护人员评估",
  "upload.gate.findDoctor": "查找附近医生",
  "upload.privacy.title": "隐私与用途",
  "upload.preview": "预览",
  "upload.analyze": "开始分析",
  "upload.q.title": "临床问卷",
  "upload.q.subtitle": "由于出现阳性线索，请回答几个问题以生成更完整的风险说明。",
  "upload.q.age": "年龄",
  "upload.q.fever": "是否发烧",
  "upload.q.coughDays": "咳嗽天数",
  "upload.q.smoking": "吸烟状态",
  "upload.q.breathing": "呼吸困难程度",
  "upload.q.never": "从不",
  "upload.q.former": "曾经",
  "upload.q.current": "目前",
  "upload.q.none": "没有",
  "upload.q.mild": "轻微",
  "upload.q.severe": "严重",
  "upload.q.submit": "生成最终报告",
  "results.title": "你的教育报告",
  "results.newUpload": "重新上传",
  "results.learnMore": "延伸阅读",
  "results.sticky": "LungLens 仅供教育用途，并非医疗诊断。请务必咨询合格医务人员。",
  "results.topicSub": "名词解释、常见情境与门诊提问方向",
  "anatomy.trachea": "气管",
  "anatomy.heart": "心脏",
  "anatomy.left-lung": "左肺",
  "anatomy.right-lung": "右肺",
  "anatomy.diaphragm": "膈肌",
  "anatomy.desc.trachea": "中线气道；若偏移可能有多种原因，需由放射科医生判读。",
  "anatomy.desc.heart": "心影大小与形状需结合临床情况解读。",
  "anatomy.desc.left-lung": "在标准 PA 视图中，左肺常显示在影像右侧。",
  "anatomy.desc.right-lung": "在标准 PA 视图中，右肺常显示在影像左侧。",
  "anatomy.desc.diaphragm": "位于肺下方的拱形肌肉，其位置可反映肺容量。",
  "learn.title": "了解胸片",
  "learn.topicPrefix": "主题：",
  "learn.coming": "即将推出",
  "about.badge": "关于 LungLens",
  "about.title": "让胸片学习更普及",
  "about.storyTitle": "项目故事",
  "about.team": "团队名单",
  "about.contactTitle": "开源 / 联系",
  "about.email": "邮件联系",
};

export const I18N: Record<Locale, Dict> = {
  en: dictEn,
  "zh-Hant": dictHant,
  "zh-Hans": dictHans,
};

export function t(locale: Locale, key: string, fallback?: string): string {
  return I18N[locale][key] ?? I18N.en[key] ?? fallback ?? key;
}

export const CONDITION_DESC: Record<
  Locale,
  Record<FindingLabel, string>
> = {
  en: CONDITION_DESCRIPTIONS,
  "zh-Hant": CONDITION_DESCRIPTIONS,
  "zh-Hans": CONDITION_DESCRIPTIONS,
};

