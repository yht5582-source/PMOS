export const sources = [
  {name:'2023 International evidence-based guideline (ASRM)',url:'https://www.asrm.org/practice-guidance/practice-committee-documents/recommendations-from-the-2023-international-evidence-based-guideline-for-the-assessment-and-management-of-polyendocrine-metabolic-ovarian-syndrome-2023/',note:'診斷、代謝篩檢、生殖與非生殖治療建議'},
  {name:'2026 nomenclature update (Monash)',url:'https://www.monash.edu/__data/assets/pdf_file/0009/4360095/Updated-PMOS-Guideline-12-June26.pdf',note:'名稱更新為 PMOS，原指引建議持續適用'}
];

export function cycleIrregular({stage,years,days,cycles,gap90}) {
  if (stage === 'adult') return days > 35 || days < 21 || cycles < 8 || gap90;
  if (!Number.isFinite(years)) return null;
  if (years < 1) return null;
  if (gap90) return true;
  if (years < 3) return days < 21 || days > 45;
  return days < 21 || days > 35 || cycles < 8;
}

export function assess(v) {
  const irregular=cycleIrregular(v);
  const hyper=!!(v.hirsutism || v.androgen);
  const morphology=v.stage==='adult' && !!(v.us || v.amh);
  const count=Number(irregular===true)+Number(hyper)+Number(morphology);
  let code, title, message;
  if(v.virilization){code='red';title='需要優先評估警訊';message='快速進展的雄性化或顯著雄激素升高，須先排除腫瘤及其他原因。';}
  else if(v.stage==='teen' && v.years<1){code='early';title='初經後第一年，避免過早定論';message='此時月經不規則可屬生理現象；追蹤症狀並評估其他病因。';}
  else if(v.stage==='teen' && irregular===true && hyper){code='compatible';title='符合青少年診斷條件組合';message='仍須排除其他病因並由臨床醫師確認；青少年不使用超音波或 AMH 作診斷。';}
  else if(v.stage==='teen'){code='at-risk';title='尚未符合青少年診斷組合';message='若有一項特徵，可列為「有風險」並追蹤；初經後約 8 年達生殖成熟時重新評估。';}
  else if(count>=2){code='compatible';title='符合成人診斷條件組合';message='成人三項中至少兩項；仍須排除其他病因並由臨床醫師確認。';}
  else {code='insufficient';title='目前條件不足以支持診斷';message='補足病史、雄激素評估與必要的影像或 AMH；若週期不規則且有高雄激素，無須再做超音波或 AMH。';}
  return {code,title,message,irregular,hyper,morphology,count};
}

export const cases=[
  {id:'A',label:'成人 · 典型表現',title:'月經稀發與多毛',stem:'26 歲，初經已 13 年。每 45–70 天來一次月經，近兩年下巴及胸前毛髮增多。無快速進展、未服荷爾蒙藥物。',prompt:'需要超音波或 AMH 才能下診斷嗎？',choices:['需要，成人必須有卵巢形態證據','不需要，週期不規則＋高雄激素已達兩項','只要痤瘡就能確診'],answer:1,explain:'成人若已有排卵功能異常與臨床或生化高雄激素，無須再以超音波或 AMH 湊第三項；仍應排除甲狀腺、泌乳素、非典型先天性腎上腺增生等原因。',next:'評估血糖（優先 75 g OGTT）、血脂、血壓、心理健康，並依生育目標討論治療。'},
  {id:'B',label:'青少年 · 過早診斷',title:'初經後 8 個月的週期變化',stem:'15 歲，初經 8 個月，月經間隔 24–48 天；只有輕度痤瘡，無多毛、無已確認的生化高雄激素。',prompt:'目前最恰當的判斷？',choices:['以超音波多囊形態確診','初經第一年可有生理性不規則，追蹤並評估症狀','AMH 偏高即可確診'],answer:1,explain:'初經後第一年的週期變異常見；痤瘡單獨作高雄激素指標的可靠度有限。青少年不以超音波或 AMH 診斷。',next:'追蹤週期與高雄激素症狀，依臨床需要評估其他病因。'},
  {id:'C',label:'青少年 · 有風險',title:'只有一項核心特徵',stem:'17 歲，初經後 4 年，月經間隔多為 50–65 天；無多毛，總／游離睪固酮未升高。',prompt:'應如何記錄？',choices:['PCOS／PMOS 已確診','有風險，追蹤並於生殖成熟時重新評估','AMH 正常即可完全排除'],answer:1,explain:'青少年需同時具備依初經年數判定的週期不規則與高雄激素。只有一項時可列為有風險並追蹤。',next:'重新檢視高雄激素、其他閉經原因與代謝風險；避免貼上不可逆診斷標籤。'},
  {id:'D',label:'成人 · 排除警訊',title:'快速雄性化',stem:'32 歲，近 4 個月突然出現明顯聲音變低、肌肉量增加與快速惡化多毛，睪固酮顯著升高。',prompt:'第一優先是？',choices:['直接標示 PCOS／PMOS，安排常規追蹤','優先評估雄激素分泌腫瘤等其他原因','僅以 AMH 評估'],answer:1,explain:'快速進展的雄性化或明顯高雄激素是警訊；不能直接歸因於 PCOS／PMOS。',next:'依臨床情境安排內分泌評估與適當影像，必要時轉診。'},
  {id:'E',label:'成人 · 生育目標',title:'希望懷孕的無排卵',stem:'29 歲，已確認 PCOS／PMOS，週期 50–90 天；與伴侶希望懷孕，評估未發現其他不孕因素。',prompt:'第一線藥物排卵誘導？',choices:['Letrozole（依所在地法規與臨床評估）','複方口服避孕藥','抗雄激素藥物單用'],answer:0,explain:'國際指引建議 letrozole 為無排卵不孕、無其他不孕因素時的一線藥物。開始前確認未懷孕，並說明各地核准狀態可能不同。',next:'同時進行孕前照護、生活型態與代謝風險評估。'},
  {id:'F',label:'成人 · 代謝風險',title:'BMI 正常仍需檢測',stem:'24 歲，BMI 21，因週期稀發與高雄激素確立診斷。沒有糖尿病家族史。',prompt:'糖代謝評估如何安排？',choices:['BMI 正常無需檢測','診斷時評估；75 g OGTT 為最準確方式','只測空腹胰島素即可'],answer:1,explain:'PCOS／PMOS 的糖代謝風險與 BMI 無關；診斷時應評估，75 g OGTT 為最準確方法，並依風險每 1–3 年重新評估。',next:'同時測血脂、每年血壓，詢問睡眠與心理健康。'}
];

export const questions=[
  {level:'住院醫師',q:'成人 PCOS／PMOS 診斷的基本架構為？',a:['三項條件全具備','排除其他病因後，三項中具備兩項','AMH 一項即可'],correct:1,why:'成人採修訂 Rotterdam 架構：排卵異常、高雄激素、卵巢多囊形態或 AMH 擇一替代形態，三取二。'},
  {level:'住院醫師',q:'成人已有週期不規則和多毛，下一個必做診斷檢查是？',a:['超音波','AMH','先排除其他病因；不需為湊條件做超音波或 AMH'],correct:2,why:'兩個核心條件已具備，無需影像或 AMH。'},
  {level:'住院醫師',q:'初經後第 1 年的月經不規則，最合理解讀是？',a:['可能是生理性變異','足以診斷 PCOS／PMOS','應立即以 AMH 確診'],correct:0,why:'初經後第一年週期不規則可屬生理現象。'},
  {level:'住院醫師',q:'青少年確診需哪些條件？',a:['多囊形態＋AMH','週期不規則＋高雄激素，且排除其他病因','BMI 增加＋痤瘡'],correct:1,why:'兩項皆必要；超音波與 AMH 不作青少年診斷。'},
  {level:'住院醫師',q:'初經後 2 年，何種週期長度屬不規則？',a:['每 28 天','每 40 天','每 50 天'],correct:2,why:'初經後 1 至未滿 3 年，<21 或 >45 天為不規則。'},
  {level:'住院醫師',q:'診斷時最準確的糖代謝評估為？',a:['75 g OGTT','空腹胰島素','BMI 追蹤即可'],correct:0,why:'建議於診斷時評估，75 g OGTT 最準確，與 BMI 無關。'},
  {level:'住院醫師',q:'無生育計畫且希望改善月經不規則和多毛時，合適的一線藥物選項是？',a:['Letrozole','複方口服避孕藥（確認適用性後）','抗雄激素單用'],correct:1,why:'複方口服避孕藥可用於週期不規則與多毛；須評估禁忌與個人偏好。'},
  {level:'住院醫師',q:'抗雄激素藥物使用時關鍵配套？',a:['有效避孕','一律停用其他藥物','不需追蹤'],correct:0,why:'避免胎兒暴露，須有有效避孕。'},
  {level:'住院醫師',q:'未排卵不孕、無其他不孕因素，藥物排卵誘導優先選擇？',a:['Letrozole','複方口服避孕藥','抗雄激素'],correct:0,why:'國際指引以 letrozole 為一線；開始前確認未懷孕並留意所在地核准狀態。'},
  {level:'住院醫師',q:'初診時的心血管代謝評估包括？',a:['只測 BMI','血脂與血壓，並評估糖代謝','只測空腹胰島素'],correct:1,why:'指引建議診斷時測血脂、血壓每年測量，並評估糖代謝。'},
  {level:'進階',q:'成人 AMH 與超音波的用法何者正確？',a:['兩者都要陽性才算一項','AMH 可作成人卵巢多囊形態的替代，但不是單獨確診測試','青少年也可用 AMH'],correct:1,why:'AMH 是成人卵巢形態指標的替代選項，不能單獨診斷，也不應與超音波當作兩個獨立條件。'},
  {level:'進階',q:'使用複方口服避孕藥期間要評估生化高雄激素，何者正確？',a:['結果可能受影響；若必要停藥至少 3 個月並確保避孕','直接以服藥期間數值排除','只看 DHEAS 即可'],correct:0,why:'避孕藥影響 SHBG 與雄激素生成，必要時停藥至少 3 個月並另行避孕。'},
  {level:'進階',q:'突然快速進展多毛、聲音變低且睪固酮顯著升高，下一步？',a:['優先排除雄激素分泌腫瘤等','立即以 PCOS／PMOS 處置','只做生活型態衛教'],correct:0,why:'快速雄性化和顯著雄激素升高需評估非 PCOS 原因。'},
  {level:'進階',q:'初經後 4 年，週期 38 天且每年 7 次，如何判定？',a:['規則','不規則','無法用週期評估'],correct:1,why:'初經後至少 3 年，>35 天或每年 <8 次屬不規則。'},
  {level:'進階',q:'青少年只有週期異常、無高雄激素時，較妥當處置？',a:['列有風險並重新評估','以超音波確診','永遠排除 PCOS／PMOS'],correct:0,why:'單一特徵者可列有風險，適時追蹤到生殖成熟（約初經後 8 年）。'},
  {level:'進階',q:'有閉經與高雄激素，初步排除其他原因可能包括？',a:['懷孕、TSH、泌乳素、17-羥基黃體素','只測 AMH','只測胰島素'],correct:0,why:'依臨床情境排除妊娠、甲狀腺、泌乳素異常、非典型先天性腎上腺增生等。'},
  {level:'進階',q:'Metformin 在成人 PCOS／PMOS 的主要用途？',a:['代謝指標，尤其 BMI ≥25 kg/m² 時可考慮','取代所有不孕治療','所有人一律處方'],correct:0,why:'主要用於代謝相關結果；共同決策並留意胃腸副作用與適用性。'},
  {level:'進階',q:'已診斷後糖代謝重新評估的常見建議間隔？',a:['每 1–3 年依風險','每 10 年','完全不需重測'],correct:0,why:'依其他糖尿病風險因素，每 1–3 年重新評估。'},
  {level:'進階',q:'長期閉經對子宮內膜的處置概念？',a:['討論週期調節或黃體素保護','完全不用處理','只做 AMH'],correct:0,why:'長期未處理閉經與子宮內膜增生風險相關，應討論週期調節與內膜保護。'},
  {level:'進階',q:'對生活型態介入，何者最符合指引？',a:['有益整體健康，無單一飲食或運動型態證實優越','只允許單一飲食法','BMI 正常者無須討論'],correct:0,why:'提供個人化、可持續的生活型態支持並避免體重汙名。'}
];
