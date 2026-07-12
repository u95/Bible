import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  X, 
  Timer, 
  RotateCcw, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Star, 
  Heart, 
  Gamepad2, 
  Play, 
  HelpCircle,
  TrendingUp,
  Flame,
  Info
} from 'lucide-react';
import { bibleBooks } from '../data/bibleData';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizCategory {
  id: string;
  tamilName: string;
  englishName: string;
  description: string;
  icon: string;
  colorClass: string;
  gradientClass: string;
}

const CATEGORIES: QuizCategory[] = [
  {
    id: 'pentateuch',
    tamilName: 'ஆதியாகமம் முதல் உபாகமம்',
    englishName: 'Pentateuch (Torah)',
    description: 'சிருஷ்டிப்பு, ஆபிரகாம், மோசே மற்றும் எகிப்திலிருந்து விடுதலை பற்றிய வினாக்கள்.',
    icon: '📜',
    colorClass: 'text-emerald-500',
    gradientClass: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'history',
    tamilName: 'வரலாற்றுப் புத்தகங்கள்',
    englishName: 'Historical Books',
    description: 'யோசுவா முதல் எஸ்தர் வரை உள்ள ராஜாக்கள், தீர்க்கதரிசிகள் மற்றும் போர்கள் பற்றிய தகவல்கள்.',
    icon: '⚔️',
    colorClass: 'text-amber-500',
    gradientClass: 'from-amber-500 to-orange-600'
  },
  {
    id: 'prophets_poetry',
    tamilName: 'சங்கீதம் & தீர்க்கதரிசிகள்',
    englishName: 'Psalms & Prophets',
    description: 'தாவீதின் சங்கீதம், நீதிமொழிகள் மற்றும் தீர்க்கதரிசிகளின் தீர்க்கதரிசனங்கள்.',
    icon: '🎺',
    colorClass: 'text-purple-500',
    gradientClass: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'gospels',
    tamilName: 'நற்செய்தி நூல்கள் (சுவிசேஷங்கள்)',
    englishName: 'The Gospels',
    description: 'இயேசுவின் பிறப்பு, அற்புதங்கள், போதனைகள், சிலுவை மரணம் மற்றும் உயிர்த்தெழுதல்.',
    icon: '✝️',
    colorClass: 'text-blue-500',
    gradientClass: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'epistles_revelation',
    tamilName: 'அப்போஸ்தலர் & நிருபங்கள்',
    englishName: 'Acts & Epistles',
    description: 'ஆதி திருச்சபை வளர்ச்சி, பவுலின் பயணங்கள் மற்றும் வெளிப்படுத்துதல் வினாக்கள்.',
    icon: '✉️',
    colorClass: 'text-rose-500',
    gradientClass: 'from-rose-500 to-pink-600'
  },
  {
    id: 'general',
    tamilName: 'பொது விவிலிய அறிவு',
    englishName: 'General Bible Knowledge',
    description: 'முழு வேதாகமத்தில் உள்ள சுவாரஸ்யமான பொதுவான அறிவு வினாக்கள்.',
    icon: '💡',
    colorClass: 'text-indigo-500',
    gradientClass: 'from-indigo-500 to-violet-600'
  }
];

// Curated pool of high-quality static questions in Tamil
const CURATED_QUESTIONS: Record<string, QuizQuestion[]> = {
  pentateuch: [
    {
      question: "தேவன் ஆதியிலே எதைப் படைத்தார்?",
      options: ["வானத்தையும் பூமியையும்", "சூரியனையும் சந்திரனையும்", "மனுஷனையும் மிருகங்களையும்", "கடலையும் மீன்களையும்"],
      correctIndex: 0,
      explanation: "ஆதியாகமம் 1:1 - 'ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்.' இது வேதாகமத்தின் முதல் வசனம்."
    },
    {
      question: "முதல் மனிதன் ஆதாம் வாழ்ந்த ஏதேன் தோட்டத்தில் இருந்து பாய்ந்து சென்ற ஆறுகளின் எண்ணிக்கை என்ன?",
      options: ["இரண்டு ஆறுகள்", "மூன்று ஆறுகள்", "நான்கு ஆறுகள்", "ஐந்து ஆறுகள்"],
      correctIndex: 2,
      explanation: "ஆதியாகமம் 2:10 - 'தோட்டத்துக்குத் தண்ணீர் பாயும்படி ஏதேனிலிருந்து ஒரு நதி புறப்பட்டு, அங்கேயிருந்து பிரிந்து நாலு கிளை ஆறுகளாயிற்று.'"
    },
    {
      question: "நோவாவின் பேழை ஜலப்பிரளயத்திற்குப் பின் எந்த மலையின் மேல் தங்கியது?",
      options: ["சீனாய் மலை", "அரராத் மலை", "நெபோ மலை", "கர்மேல் மலை"],
      correctIndex: 1,
      explanation: "ஆதியாகமம் 8:4 - 'ஏழாம் மாதம் பதினேழாம் தேதியிலே பேழை அரராத் மலைகளின்மேல் தங்கியது.'"
    },
    {
      question: "விசுவாசத்தின் பிதாவாகிய ஆபிரகாமுக்கு பிறந்த முதல் குமாரன் யார்?",
      options: ["ஈசாக்கு", "இஸ்மவேல்", "ஏசா", "யாக்கோபு"],
      correctIndex: 1,
      explanation: "ஆதியாகமம் 16:15 - 'ஆகார் ஆபிரகாமுக்கு ஒரு குமாரனைப் பெற்றாள்; ஆபிரகாம் தனக்கு ஆகார் பெற்ற குமாரனுக்கு இஸ்மவேல் என்று பேரிட்டான்.'"
    },
    {
      question: "ஈசாக்கிற்கு மனைவியாகத் தேர்ந்தெடுக்கப்பட்ட பெண் யார்?",
      options: ["ரெபெக்காள்", "ராகேல்", "லேயாள்", "சாராள்"],
      correctIndex: 0,
      explanation: "ஆதியாகமம் 24:67 - 'ஈசாக்கு அவளைத் தன் தாயாகிய சாராளின் கூடாரத்திலே கூட்டிக்கொண்டுபோய், அவளைத் தனக்கு மனைவியாக்கிக்கொண்டு, அவளை நேசித்தான்.'"
    },
    {
      question: "யோசேப்பை எகிப்திய அடிமை வியாபாரிகளுக்கு அவரது சகோதரர்கள் எத்தனை வெள்ளிக்காசுக்கு விற்றனர்?",
      options: ["பத்து வெள்ளிக்காசு", "இருபது வெள்ளிக்காசு", "முப்பது வெள்ளிக்காசு", "ஐம்பது வெள்ளிக்காசு"],
      correctIndex: 1,
      explanation: "ஆதியாகமம் 37:28 - 'அவர்கள் யோசேப்பைக் குழியிலிருந்து தூக்கியெடுத்து, இஸ்மவேலருக்கு இருபது வெள்ளிக்காசுக்கு விற்றுப்போட்டார்கள்.'"
    },
    {
      question: "முட்செடி எரியும் அற்புத தரிசனத்தின் மூலம் மோசேக்கு அழைப்புக் கொடுத்தது யார்?",
      options: ["கர்த்தருடைய தூதன்", "ஆரோன்", "யோசுவா", "நெகேமியா"],
      correctIndex: 0,
      explanation: "யாத்திராகமம் 3:2 - 'அங்கே கர்த்தருடைய தூதன் ஒரு முட்செடியின் நடுவிலிருந்து எழும்பின அக்கினிஜவாலையிலே அவனுக்குத் தரிசனமானார்.'"
    },
    {
      question: "எகிப்தின் மேல் தேவன் கட்டளையிட்ட வாதைகள் (கொள்ளைநோய்கள்) மொத்தம் எத்தனை?",
      options: ["ஏழு", "எட்டு", "ஒன்பது", "பத்து"],
      correctIndex: 3,
      explanation: "யாத்திராகமம் 7-12 அதிகாரங்களில் விவரிக்கப்பட்டுள்ளபடி, இஸ்ரவேலரை விடுவிக்க தேவன் எகிப்தியர் மேல் 10 வாதைகளை வரப்பண்ணினார்."
    },
    {
      question: "தேவன் சீனாய் மலையில் மோசேக்குக் கொடுத்த பத்து கற்பனைகள் எழுதப்பட்ட கற்பலகைகளின் எண்ணிக்கை எவ்வளவு?",
      options: ["ஒன்று", "இரண்டு", "மூன்று", "நான்கு"],
      correctIndex: 1,
      explanation: "யாத்திராகமம் 31:18 - 'அவர் சீனாய் மலையில் மோசேயோடு பேசி முடித்தபோது, தேவனுடைய விரலினால் எழுதப்பட்ட கற்பலகைகளாகிய சாட்சியின் இரண்டு பலகைகளை அவனிடத்தில் கொடுத்தார்.'"
    },
    {
      question: "மோசேயின் மரணத்திற்குப் பிறகு இஸ்ரவேல் ஜனங்களை கானான் தேசத்திற்கு வழிநடத்தியவர் யார்?",
      options: ["கீலேயாத்", "யோசுவா", "காலேபு", "ஆரோன்"],
      correctIndex: 1,
      explanation: "உபாகமம் 34:9 & யோசுவா 1:1-2 - மோசேயின் மரணத்திற்குப் பின் நூனின் குமாரனாகிய யோசுவாவை கர்த்தர் தலைவராக நியமித்தார்."
    }
  ],
  history: [
    {
      question: "எரிகோ நகரின் மதில்கள் இஸ்ரவேலர்கள் எத்தனை முறை சுற்றி வந்தபின் விழுந்து நொறுங்கின?",
      options: ["மூன்று முறை", "ஐந்து முறை", "ஏழு முறை", "பன்னிரண்டு முறை"],
      correctIndex: 2,
      explanation: "யோசுவா 6:15-20 - ஏழாம் நாளில் ஏழாவது முறை நகரத்தைச் சுற்றி வந்து, ஆசாரியர்கள் எக்காளம் ஊதி, ஜனங்கள் ஆரவாரித்தபோது மதில்கள் விழுந்தன."
    },
    {
      question: "இஸ்ரவேல் கோத்திரங்களை வழிநடத்திய முதல் நியாயாதிபதி யார்?",
      options: ["சிம்சோன்", "கிதியோன்", "ஒத்னியேல்", "ஏகூத்"],
      correctIndex: 2,
      explanation: "நியாயாதிபதிகள் 3:9 - 'கர்த்தர் இஸ்ரவேல் புத்திரரை இரட்சிக்கும்படி காலேபின் தம்பியான கேனாசின் குமாரனாகிய ஒத்னியேல் என்னும் ஒரு இரட்சகனை எழும்பப்பண்ணினார்.'"
    },
    {
      question: "இஸ்ரவேலின் மகா பலசாலியாகிய சிம்சோனின் பலத்தின் இரகசியம் எங்கே அடங்கியிருந்தது?",
      options: ["அவரது கைகளில்", "அவரது தலைமுடியில்", "அவரது உடையில்", "அவரது கால்களில்"],
      correctIndex: 1,
      explanation: "நியாயாதிபதிகள் 16:17 - 'நான் என் தாயின் கர்ப்பத்தில் பிறந்ததுமுதல் தேவனுக்கு நசரேயன்; என் சவரகன் கத்தி என் தலையின்மேல் பட்டதேயில்லை; என் சவரம் சிரிக்கப்பட்டால், என் பலம் என்னைவிட்டு நீங்கும்.'"
    },
    {
      question: "நகோம் என்ற மாமியாரோடு இஸ்ரவேலுக்கு வந்த உண்மையுள்ள மோவாபியப் பெண் யார்?",
      options: ["ரூத்", "ஒர்பாள்", "எஸ்தர்", "வாஸ்தி"],
      correctIndex: 0,
      explanation: "ரூத் 1:16 - 'ரூத்: நான் உம்மைப் பின்பற்றி வராமல், உம்மைவிட்டுத் திரும்பிப்போவதைக் குறித்து என்னோடு பேசவேண்டாம்; நீர் போகும் இடத்திற்கு நானும் வருவேன்.'"
    },
    {
      question: "இஸ்ரவேல் தேசத்தின் முதல் ராஜாவாக அபிஷேகம் பண்ணப்பட்டவர் யார்?",
      options: ["தாவீது", "சவுல்", "சாலொமோன்", "ரெகொபெயாம்"],
      correctIndex: 1,
      explanation: "1 சாமுவேல் 10:1 - சாமுவேல் தைலக்குப்பியை எடுத்து சவுலின் தலையின்மேல் வார்த்து, முத்தமிட்டு, அவனைக் கர்த்தருடைய ஜனத்தின்மேல் ராஜாவாக அபிஷேகம் செய்தார்."
    },
    {
      question: "தாவீது மகா கோலியாத்தை வீழ்த்த பயன்படுத்திய ஆயுதங்கள் யாவை?",
      options: ["ஒரு வாள் மற்றும் ஈட்டி", "ஒரு வில் மற்றும் அம்பு", "ஒரு கவண் மற்றும் ஒரு கல்", "நெருப்புப் பந்தங்கள்"],
      correctIndex: 2,
      explanation: "1 சாமுவேல் 17:49 - 'தாவீது தன் பையிலே கைபோட்டு, அதிலிருந்து ஒரு கல்லை எடுத்து, கவணில் வைத்து விசிறி, பெலிஸ்தனுடைய நெற்றியிலே பட எறிந்தான்; அந்தக் கல் அவன் நெற்றிக்குள் பதிந்துபோனது.'"
    },
    {
      question: "சாலொமோன் ராஜா எருசலேமில் கர்த்தருக்குக் கட்டிய தேவாலயத்தின் கட்டுமானப் பணி எத்தனை ஆண்டுகள் நீடித்தது?",
      options: ["மூன்று ஆண்டுகள்", "ஐந்து ஆண்டுகள்", "ஏழு ஆண்டுகள்", "பத்து ஆண்டுகள்"],
      correctIndex: 2,
      explanation: "1 இராஜாக்கள் 6:38 - 'பதினோராம் வருடம் பூல் எனப்படுகிற எட்டாம் மாதத்திலே, ஆலயம் அதின் எல்லாப் பகுதிகளின்படியும் அதின் எல்லாத் திட்டங்களின்படியும் கட்டி முடிந்தது. அவன் அதை ஏழு வருஷமாகக் கட்டினான்.'"
    },
    {
      question: "எலியா தீர்க்கதரிசி பஞ்ச காலத்தில் எந்த நதிக்கரையில் காகங்களால் காலையிலும் மாலையிலும் போஷிக்கப்பட்டார்?",
      options: ["யோர்தான் நதி", "கெரீத் நதி", "நைல் நதி", "யூப்ரடீஸ் நதி"],
      correctIndex: 1,
      explanation: "1 இராஜாக்கள் 17:5-6 - 'அவன் கர்த்தருடைய வார்த்தையின்படியே போய், யோர்தானுக்கு எதிரே இருக்கிற கெரீத் ஆற்றண்டையிலே தங்கியிருந்தான். காகங்கள் அவனுக்குக் காலையிலே அப்பமும் இறைச்சியும், மாலையிலே அப்பமும் இறைச்சியும் கொண்டுவந்தன.'"
    },
    {
      question: "நெகேமியா எருசலேமின் இடிந்து கிடந்த மதில்களைக் கட்டி முடிக்க எத்தனை நாட்கள் எடுத்துக்கொண்டார்?",
      options: ["முப்பது நாட்கள்", "நாற்பது நாட்கள்", "ஐம்பத்திரண்டு நாட்கள்", "நூறு நாட்கள்"],
      correctIndex: 2,
      explanation: "நெகேமியா 6:15 - 'மதிலானது ஏலூல் மாதம் இருபத்தைந்தாம் தேதியாகிய ஐம்பத்திரண்டு நாளைக்குள்ளே கட்டி முடிந்தது.'"
    },
    {
      question: "யூத மக்களை ஆமானின் கொடூர சூழ்ச்சியிலிருந்து காப்பாற்றிய எஸ்தர் ராணியின் மாமா யார்?",
      options: ["மொர்தெகாய்", "நெகேமியா", "எஸ்றா", "ஆகாஸ்"],
      correctIndex: 0,
      explanation: "எஸ்தர் 2:7 - மொர்தெகாய் தனக்குச் சிற்றப்பன் மகளாகிய எஸ்தரை வளர்த்தார். அவளுக்குத் தாயும் தந்தையும் இல்லாதிருந்தபடியால் அவளைத் தன் குமாரத்தியாக ஏற்றுக்கொண்டார்."
    }
  ],
  prophets_poetry: [
    {
      question: "வேதாகமத்தின் மிக நீண்ட அதிகாரத்தைக் கொண்ட புத்தகம் எது?",
      options: ["சங்கீதம்", "ஏசாயா", "எரேமியா", "ஆதியாகமம்"],
      correctIndex: 0,
      explanation: "சங்கீதம் 119 தான் வேதாகமத்தின் மிக நீண்ட அதிகாரமாகும், இதில் 176 வசனங்கள் உள்ளன."
    },
    {
      question: "'கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான்...' - இந்த உலகப் புகழ்பெற்ற சங்கீதத்தின் அடுத்த வார்த்தை எது?",
      options: ["பயப்படேன்", "தாழ்ச்சியடையேன்", "மகிழ்ந்திருப்பேன்", "உறங்குவேன்"],
      correctIndex: 1,
      explanation: "சங்கீதம் 23:1 - 'கர்த்தர் என் மேய்ப்பராயிருக்கிறார், நான் தாழ்ச்சியடையேன். அவர் என்னைப் பசும்புல்லுள்ள இடங்களில் மேய்த்து...'"
    },
    {
      question: "அறிவுரை, புத்திமதிகள் மற்றும் சாலொமோனின் ஞான வசனங்களை அதிகமாகக் கொண்டுள்ள பழைய ஏற்பாட்டுப் புத்தகம் எது?",
      options: ["நீதிமொழிகள்", "பிரசங்கி", "உன்னதப்பாட்டு", "யோபு"],
      correctIndex: 0,
      explanation: "நீதிமொழிகள் புத்தகம் சாலொமோன் எழுதிய ஞான போதனைகளையும், வாழ்வியல் ஆலோசனைகளையும் கொண்டுள்ளது."
    },
    {
      question: "தேவனுடைய கட்டளைக்குக் கீழ்ப்படியாமல் தப்பியோடி, ஒரு பெரிய மீனின் வயிற்றில் மூன்று பகலும் மூன்று இரவும் இருந்த தீர்க்கதரிசி யார்?",
      options: ["ஏசாயா", "எரேமியா", "யோனா", "தானியேல்"],
      correctIndex: 2,
      explanation: "யோனா 1:17 - 'ஒரு பெரிய மீன் யோனாவை விழுங்கும்படி கர்த்தர் கட்டளையிட்டிருந்தார்; அந்த மீனின் வயிற்றில் யோனா மூன்று பகலும் மூன்று இரவும் இருந்தான்.'"
    },
    {
      question: "நேபுகாத்நேச்சார் ராஜாவின் எரிகிற அக்கினிச் சூளையிலிருந்து அற்புதமாகக் காப்பாற்றப்பட்ட தீர்க்கதரிசியின் நண்பர்கள் எத்தனை பேர்?",
      options: ["இரண்டு பேர்", "மூன்று பேர்", "நான்கு பேர்", "ஐந்து பேர்"],
      correctIndex: 1,
      explanation: "தானியேல் 3:23-25 - சாத்ராக், மேஷாக், ஆபேத்நேகோ ஆகிய மூன்று நண்பர்கள் தீச்சூளையில் வீசப்பட்டனர், ஆனால் தேவதூதனோடு அவர்கள் தீக்காயம் இன்றி உலா வந்தனர்."
    },
    {
      question: "ராஜாக்களின் கட்டளைக்கு அஞ்சாமல் ஒரு நாளைக்கு மூன்று முறை ஜெபித்ததால் சிங்கக் கெபியில் வீசப்பட்ட தீர்க்கதரிசி யார்?",
      options: ["தானியேல்", "எசேக்கியேல்", "ஓசியா", "ஆமோஸ்"],
      correctIndex: 0,
      explanation: "தானியேல் 6-ஆம் அதிகாரத்தில் விவரிக்கப்பட்டுள்ளபடி, தானியேல் சிங்கக் கெபியில் வீசப்பட்டார், ஆனால் தேவன் சிங்கங்களின் வாயைக் கட்டி அவரைக் காப்பாற்றினார்."
    },
    {
      question: "ஏசாயா தீர்க்கதரிசி எந்த யூத ராஜாவின் மரண வருடத்தில் கர்த்தரை உயரமும் உன்னதமுமான சிங்காசனத்தில் வீற்றிருக்கக் கண்டார்?",
      options: ["உசியா ராஜா", "ஆகாஸ் ராஜா", "எசேக்கியா ராஜா", "யோசியா ராஜா"],
      correctIndex: 0,
      explanation: "ஏசாயா 6:1 - 'உசியா ராஜா மரணமடைந்த வருஷத்தில், கர்த்தர் உயரமும் உன்னதமுமான சிங்காசனத்தின்மேல் வீற்றிருக்கக்கண்டேன்; அவருடைய வஸ்திரத்தொங்கலால் தேவாலயம் நிறைந்திருந்தது.'"
    },
    {
      question: "தன் ஜனத்தின் அழிவைக் கண்டு கலங்கி எழுதியதால், 'அழுகையின் தீர்க்கதரிசி' என்று அழைக்கப்படுபவர் யார்?",
      options: ["எரேமியா", "ஆமோஸ்", "ஏசாயா", "மல்கியா"],
      correctIndex: 0,
      explanation: "எரேமியா தீர்க்கதரிசி யூதாவின் சிறையிருப்பு மற்றும் எருசலேமின் அழிவைக் குறித்துப் பாரத்தோடு புலம்பி அழுததால் இந்த பெயரைப் பெற்றார்."
    },
    {
      question: "பழைய ஏற்பாட்டின் 39-வது புத்தகமாகவும், கடைசி தீர்க்கதரிசனப் புத்தகமாகவும் விளங்குவது எது?",
      options: ["சகரியா", "மல்கியா", "ஆகாய்", "செப்பனியா"],
      correctIndex: 1,
      explanation: "மல்கியா தீர்க்கதரிசியின் புத்தகம் பழைய ஏற்பாட்டின் இறுதிப் புத்தகமாகும். இது புதிய ஏற்பாட்டிற்கு முந்தைய காலத்தைக் காட்டுகிறது."
    }
  ],
  gospels: [
    {
      question: "இயேசு கிறிஸ்து யூதேயாவிலுள்ள எந்த ஊரில் பிறந்தார்?",
      options: ["நாசரேத்து", "பெத்லகேம்", "எருசலேம்", "கப்பர்நகூம்"],
      correctIndex: 1,
      explanation: "மத்தேயு 2:1 - 'ஏரோது ராஜாவின் நாட்களிலே யூதேயாவிலுள்ள பெத்லகேமிலே இயேசு பிறந்தபோது, கிழக்கிலிருந்து சாஸ்திரிகள் எருசலேமுக்கு வந்து...'"
    },
    {
      question: "இயேசு கிறிஸ்துவை முத்தமிட்டு, முப்பது வெள்ளிக்காசுக்காக பிரதான ஆசாரியர்களிடம் காட்டிக்கொடுத்த சீஷன் யார்?",
      options: ["சீமோன் பேதுரு", "யூதாஸ் காரியோத்து", "தோமா", "யோவான்"],
      correctIndex: 1,
      explanation: "மத்தேயு 26:48-49 - காட்டிக்கொடுக்கிறவன்: 'நான் யாரை முத்தமிடுவேனோ அவன்தான், அவனைப் பிடித்துக்கொள்ளுங்கள்' என்று அடையாளம் சொல்லியிருந்தான். உடனே இயேசுவண்டையில் வந்து வாழ்த்தி முத்தமிட்டான்."
    },
    {
      question: "வனாந்தரத்தில் ஒட்டக மயிர் ஆடை அணிந்து, வெட்டுக்கிளியும் காட்டுத்தேனும் உண்டு இயேசுவுக்கு வழிஆயத்தம் செய்தவர் யார்?",
      options: ["எலியா", "யோவான் ஸ்நானகன்", "பவுல்", "தீமோத்தேயு"],
      correctIndex: 1,
      explanation: "மத்தேயு 3:1-4 - 'அந்நாட்களிலே யோவான்ஸ்நானன் வந்து, யூதேயாவின் வனாந்தரத்தில் பிரசங்கித்து... அவனுடைய ஆகாரம் வெட்டுக்கிளியும் காட்டுத்தேனுமாயிருந்தது.'"
    },
    {
      question: "இயேசு கிறிஸ்து செய்த முதல் அற்புதம் எது?",
      options: ["குஷ்டரோகியைக் குணமாக்கியது", "குருடனுக்குக் கண் கொடுத்தது", "தண்ணீரைத் திராட்சரசமாக மாற்றியது", "கடலின் மேல் நடந்தது"],
      correctIndex: 2,
      explanation: "யோவான் 2:11 - 'கானாவூரிலே செய்த இந்த முதலாம் அற்புதத்தினாலே இயேசு தன் மகிமையை வெளிப்படுத்தினார்; அவருடைய சீஷர்கள் அவரிடத்தில் விசுவாசம் வைத்தார்கள்.'"
    },
    {
      question: "இயேசு பிசாசு பிடித்த மனிதனைக் குணப்படுத்தியபோது, பிசாசுகள் கெஞ்சி எந்த விலங்குகளுக்குள் சென்றன?",
      options: ["ஆடுகள்", "மாடுகள்", "பன்றிகள்", "குதிரைகள்"],
      correctIndex: 2,
      explanation: "மாற்கு 5:12-13 - 'அப்பொழுது பிசாசுகள்: நாங்கள் அந்தப் பன்றிகளுக்குள் பிரவேசிக்கும்படி எங்களுக்கு உத்தரவு கொடுக்கவேண்டும் என்று அவரை வேண்டிக்கொண்டன. இயேசு உடனே உத்தரவு கொடுத்தார்.'"
    },
    {
      question: "இயேசு ஐந்து அப்பங்களையும் இரண்டு மீன்களையும் கொண்டு வனாந்தரத்தில் எத்தனை பேருக்கு உணவளித்தார்?",
      options: ["மூன்றாயிரம் பேர்", "ஐயாயிரம் புருஷர்கள்", "ஏழாயிரம் பேர்", "பத்தாயிரம் பேர்"],
      correctIndex: 1,
      explanation: "மத்தேயு 14:21 - 'ஸ்திரீகளும் பிள்ளைகளும் தவிர, சாப்பிட்ட புருஷர்கள் ஏறக்குறைய ஐயாயிரம்பேராயிருந்தார்கள்.'"
    },
    {
      question: "இயேசு கைது செய்யப்பட்ட இரவில், சேவல் கூவுகிறதற்கு முன்னே தன்னை மூன்று முறை மறுதலிப்பாய் என்று யாரிடம் கூறினார்?",
      options: ["யோவான்", "யாக்கோபு", "பேதுரு", "அந்திரேயா"],
      correctIndex: 2,
      explanation: "மத்தேயு 26:34 - 'இயேசு அவனை நோக்கி: இந்த இராத்திரியிலே சேவல் கூவுகிறதற்கு முன்னே, நீ என்னை மூன்று தரம் மறுதலிப்பாய் என்று மெய்யாகவே உனக்குச் சொல்லுகிறேன் என்றார்.'"
    },
    {
      question: "மரணமடைந்து நான்கு நாட்கள் கல்லறையில் அழுகிப்போயிருந்த நிலையில் இயேசுவினால் உயிரோடு எழுப்பப்பட்டவர் யார்?",
      options: ["லாசரு", "யவீருவின் குமாரத்தி", "விதவையின் மகன்", "மத்தேயு"],
      correctIndex: 0,
      explanation: "யோவான் 11-ஆம் அதிகாரத்தில் விவரிக்கப்பட்டுள்ளபடி, பெத்தானியாவைச் சேர்ந்த லாசருவை இயேசு 'லாசருவே, வெளியே வா' என்று கூப்பிட்டு உயிரோடு எழுப்பினார்."
    },
    {
      question: "இயேசு சிலுவையில் தொங்கும்போது கடைசியாகக் கூறி தன் ஜீவனை விட்ட வார்த்தை என்ன?",
      options: ["எலோகி எலோகி லமா சபக்தானி", "தாகமாயிருக்கிறேன்", "முடிந்தது", "பிதாவே உம்முடைய கைகளில் என் ஆவியை ஒப்புவிக்கிறேன்"],
      correctIndex: 2,
      explanation: "யோவான் 19:30 - 'இயேசு காடியை வாங்கினபின்பு, முடிந்தது என்று சொல்லி, தலையைச் சாய்த்து, ஆவியை ஒப்புவித்தார்.'"
    }
  ],
  epistles_revelation: [
    {
      question: "ஆதி திருச்சபையின் வரலாறு மற்றும் பரிசுத்த ஆவியானவரின் செயல்பாடுகளை விவரிக்கும் புதிய ஏற்பாட்டுப் புத்தகம் எது?",
      options: ["அப்போஸ்தலர் நடபடிகள்", "ரோமர்", "எபேசியர்", "கலாத்தியர்"],
      correctIndex: 0,
      explanation: "அப்போஸ்தலர் நடபடிகள் (Acts of the Apostles) புத்தகம் இயேசுவின் பரமேறுதலுக்குப் பின் திருச்சபை பரவிய வரலாற்றைக் கூறுகிறது."
    },
    {
      question: "கிறிஸ்தவர்களைக் கொடூரமாகத் துன்புறுத்தி, பின்னர் தமஸ்கு பாதையில் இயேசுவைத் தரிசித்து பெரும் அப்போஸ்தலனாக மாறியவர் யார்?",
      options: ["சீலாஸ்", "சவுல் (பவுல்)", "பர்னபா", "தீத்து"],
      correctIndex: 1,
      explanation: "அப்போஸ்தலர் 9-ஆம் அதிகாரத்தில் பவுலின் மனமாற்றம் விவரிக்கப்பட்டுள்ளது. சவுல் என்ற பெயருடைய அவர் பவுலாக மாறி உலகெங்கும் நற்செய்தி அறிவித்தார்."
    },
    {
      question: "புதிய ஏற்பாட்டின் இறுதி தீர்க்கதரிசனப் புத்தகமாகிய 'வெளிப்படுத்துதல்' புத்தகம் யாரால் எழுதப்பட்டது?",
      options: ["அப்போஸ்தலனாகிய யோவான்", "பவுல்", "பேதுரு", "யூதா"],
      correctIndex: 0,
      explanation: "வெளிப்படுத்துதல் 1:1 - இயேசு கிறிஸ்து தம்முடைய ஊழியக்காரனாகிய யோவானுக்குத் தம்முடைய தூதனை அனுப்பி வெளிப்படுத்திய தரிசனம் இது."
    },
    {
      question: "யோவான் வெளிப்படுத்துதல் தரிசனத்தைக் கண்டு எழுதிய ஆசியாவிலுள்ள தீவின் பெயர் என்ன?",
      options: ["சைப்பிரஸ் தீவு", "கிரேத்தா தீவு", "பத்மு தீவு", "மால்தா தீவு"],
      correctIndex: 2,
      explanation: "வெளிப்படுத்துதல் 1:9 - 'தேவவசனத்தினிமித்தமும் இயேசு கிறிஸ்துவைப்பற்றிய சாட்சியினிமித்தமும் பத்மு என்னப்பட்ட தீவிலே இருந்தேன்.'"
    },
    {
      question: "அன்பின் மேன்மைகளைக் குறித்து மிக ஆழமாகவும் அழகாகவும் பவுல் விளக்கியுள்ள நிருபம் மற்றும் அதிகாரம் எது?",
      options: ["ரோமர் 8", "1 கொரிந்தியர் 13", "எபேசியர் 6", "பிலிப்பியர் 4"],
      correctIndex: 1,
      explanation: "1 கொரிந்தியர் 13-வது அதிகாரம் 'அன்பின் அதிகாரம்' என்று அழைக்கப்படுகிறது. 'அன்பு நீடிய சாந்தமும் தயவுமுள்ளது; அன்புக்குப் பொறாமையில்லை...' என இது தொடங்கும்."
    },
    {
      question: "பவுல் தன்னுடைய விசுவாசமுள்ள ஆவிக்குரிய குமாரனாக ஏற்றுக்கொண்டு இரண்டு நிருபங்களை எழுதிய இளம் போதகர் யார்?",
      options: ["தீமோத்தேயு", "தீத்து", "பிலேமோன்", "பரனபா"],
      correctIndex: 0,
      explanation: "1 தீமோத்தேயு 1:2 - 'விசுவாசத்தில் உத்தம குமாரனாகிய தீமோத்தேயுவுக்கு எழுதுகிறதாவது...'"
    },
    {
      question: "விசுவாசத்தின் வீரர்களைப் பட்டியலிடும் புதிய ஏற்பாட்டு அதிகாரம் எது?",
      options: ["ரோமர் 12", "எபிரெயர் 11", "யாக்கோபு 2", "1 பேதுரு 1"],
      correctIndex: 1,
      explanation: "எபிரெயர் 11-வது அதிகாரம் 'விசுவாசத்தின் அதிகாரம்' என்று புகழப்படுகிறது. ஆபேல், நோவா, ஆபிரகாம் முதல் பலரின் விசுவாசத்தை விவரிக்கிறது."
    }
  ],
  general: [
    {
      question: "பரிசுத்த வேதாகமத்தில் மொத்தம் எத்தனை புத்தகங்கள் உள்ளன?",
      options: ["60 புத்தகங்கள்", "66 புத்தகங்கள்", "73 புத்தகங்கள்", "80 புத்தகங்கள்"],
      correctIndex: 1,
      explanation: "புரோட்டஸ்டன்ட் வேதாகமத்தில் பழைய ஏற்பாட்டில் 39 புத்தகங்களும், புதிய ஏற்பாட்டில் 27 புத்தகங்களும் என மொத்தம் 66 புத்தகங்கள் உள்ளன."
    },
    {
      question: "பழைய ஏற்பாட்டில் உள்ள நூல்களின் எண்ணிக்கை எவ்வளவு?",
      options: ["27", "39", "46", "50"],
      correctIndex: 1,
      explanation: "ஆதியாகமம் முதல் மல்கியா வரை பழைய ஏற்பாட்டில் மொத்தம் 39 புத்தகங்கள் உள்ளன."
    },
    {
      question: "புதிய ஏற்பாட்டில் உள்ள நூல்களின் எண்ணிக்கை எவ்வளவு?",
      options: ["21", "27", "39", "12"],
      correctIndex: 1,
      explanation: "மத்தேயு முதல் வெளிப்படுத்துதல் வரை புதிய ஏற்பாட்டில் மொத்தம் 27 புத்தகங்கள் உள்ளன."
    },
    {
      question: "முழு வேதாகமத்திலும் மிகக் குறுகிய அதிகாரத்தைக் கொண்ட சங்கீதம் எது?",
      options: ["சங்கீதம் 23", "சங்கீதம் 100", "சங்கீதம் 117", "சங்கீதம் 150"],
      correctIndex: 2,
      explanation: "சங்கீதம் 117-ல் இரண்டே இரண்டு வசனங்கள் மட்டுமே உள்ளன. இதுவே மிகக் குறுகிய அதிகாரமாகும்."
    },
    {
      question: "முதல் மனிதர்களாகிய ஆதாம் மற்றும் ஏவாளுக்குப் பிறந்த முதல் இரண்டு மகன்கள் யார்?",
      options: ["காயீன் மற்றும் ஆபேல்", "சேத் மற்றும் நோவா", "இஸ்மவேல் மற்றும் ஈசாக்கு", "யாக்கோபு மற்றும் ஏசா"],
      correctIndex: 0,
      explanation: "ஆதியாகமம் 4:1-2 - ஏவாள் காயீனையும், பின்பு அவனுடைய தம்பியாகிய ஆபேலையும் பெற்றாள்."
    },
    {
      question: "வேதாகமத்திலேயே மிக அதிக நாட்கள் (969 ஆண்டுகள்) உயிர்வாழ்ந்த மனிதர் யார்?",
      options: ["ஆதாம்", "நோவா", "மெத்தூசலா", "ஏனோக்கு"],
      correctIndex: 2,
      explanation: "ஆதியாகமம் 5:27 - 'மெத்தூசலா பிழைத்திருந்த நாளெல்லாம் தொளாயிரத்து அறுபத்தொன்பது வருஷம்; அவன் மரித்தான்.'"
    }
  ]
};

// Standard structure trivia templates to fill levels 1-100 dynamically
const STRUCTURE_TEMPLATES = [
  (level: number, catId: string) => {
    // Books chapter counts
    const testBooks = catId === 'gospels' || catId === 'epistles_revelation' 
      ? bibleBooks.filter(b => b.testament === 'New')
      : bibleBooks.filter(b => b.testament === 'Old');
    
    const book = testBooks[level % testBooks.length];
    return {
      question: `${book.tamilName} புத்தகத்தில் மொத்தம் எத்தனை அதிகாரங்கள் (Chapters) உள்ளன?`,
      options: [
        `${book.chapters} அதிகாரங்கள்`,
        `${Math.max(1, book.chapters - 5)} அதிகாரங்கள்`,
        `${book.chapters + 8} அதிகாரங்கள்`,
        `${book.chapters * 2} அதிகாரங்கள்`
      ].sort(() => Math.sin(level) - 0.5),
      correctIndex: 0, // This will be calculated because we sort it!
      explanation: `உண்மை விபரம்: பரிசுத்த வேதாகமத்தில் உள்ள ${book.tamilName} (${book.englishName}) புத்தகம் மொத்தம் ${book.chapters} அதிகாரங்களைக் கொண்டுள்ளது.`
    };
  },
  (level: number) => {
    const bookIndex = (level * 3) % bibleBooks.length;
    const currentBook = bibleBooks[bookIndex];
    const nextBook = bibleBooks[(bookIndex + 1) % bibleBooks.length];
    return {
      question: `பரிசுத்த விவிலிய வரிசைப்படி, "${currentBook.tamilName}" புத்தகத்திற்கு அடுத்ததாக வரும் புத்தகம் எது?`,
      options: [
        nextBook.tamilName,
        bibleBooks[Math.max(0, bookIndex - 1)].tamilName,
        bibleBooks[(bookIndex + 5) % bibleBooks.length].tamilName,
        bibleBooks[(bookIndex + 12) % bibleBooks.length].tamilName
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4), // filter duplicates
      correctIndex: 0,
      explanation: `வரிசை ஒழுங்கு: ${currentBook.tamilName} புத்தகத்திற்கு அடுத்து ${nextBook.tamilName} புத்தகம் அமைந்துள்ளது.`
    };
  },
  (level: number) => {
    const bookIndex = (level * 7) % bibleBooks.length;
    const book = bibleBooks[bookIndex];
    return {
      question: `"${book.tamilName}" புத்தகம் வேதாகமத்தின் எந்தப் பகுதியில் (Testament) இடம்பெற்றுள்ளது?`,
      options: [
        "பழைய ஏற்பாடு (Old Testament)",
        "புதிய ஏற்பாடு (New Testament)",
        "இரண்டுமே இல்லை",
        "இரண்டிலும் உள்ளது"
      ],
      correctIndex: book.testament === 'Old' ? 0 : 1,
      explanation: `புத்தகப் பகுதி: ${book.tamilName} புத்தகம் ${book.testament === 'Old' ? 'பழைய ஏற்பாட்டில்' : 'புதிய ஏற்பாட்டில்'} இடம்பெற்றுள்ள ஒரு புனித நூலாகும்.`
    };
  }
];

export default function BibleQuiz({ isDarkMode, onBack }: { isDarkMode: boolean; onBack: () => void }) {
  // Navigation Screens: "categories" | "levels" | "play"
  const [quizScreen, setQuizScreen] = useState<'categories' | 'levels' | 'play'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>(CATEGORIES[0]);
  
  // Game states
  const [quizProgress, setQuizProgress] = useState<Record<string, number>>({}); // catId -> maxUnlockedLevel
  const [quizStars, setQuizStars] = useState<Record<string, Record<number, number>>>({}); // catId -> levelNum -> stars
  const [totalScore, setTotalScore] = useState<number>(0);
  
  // Active Level States
  const [activeLevelNum, setActiveLevelNum] = useState<number>(1);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [levelScore, setLevelScore] = useState<number>(0);
  
  // Game timer states
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sparkle particle burst animation on correct answer
  const [showSparkles, setShowSparkles] = useState<boolean>(false);

  // Level result modal
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [resultStatus, setResultStatus] = useState<'won' | 'lost'>('won');

  // Load Progress from Local Storage
  useEffect(() => {
    const savedProgress = localStorage.getItem('umn_quiz_progress_v1');
    const savedStars = localStorage.getItem('umn_quiz_stars_v1');
    const savedScore = localStorage.getItem('umn_quiz_score_v1');

    if (savedProgress) {
      try {
        setQuizProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error("Error parsing quiz progress", e);
        const initialProgress: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          initialProgress[cat.id] = 1;
        });
        setQuizProgress(initialProgress);
      }
    } else {
      // Default level 1 unlocked for all categories
      const initialProgress: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        initialProgress[cat.id] = 1;
      });
      setQuizProgress(initialProgress);
      localStorage.setItem('umn_quiz_progress_v1', JSON.stringify(initialProgress));
    }

    if (savedStars) {
      try {
        setQuizStars(JSON.parse(savedStars));
      } catch (e) {
        console.error("Error parsing quiz stars", e);
        const initialStars: Record<string, Record<number, number>> = {};
        CATEGORIES.forEach(cat => {
          initialStars[cat.id] = {};
        });
        setQuizStars(initialStars);
      }
    } else {
      const initialStars: Record<string, Record<number, number>> = {};
      CATEGORIES.forEach(cat => {
        initialStars[cat.id] = {};
      });
      setQuizStars(initialStars);
      localStorage.setItem('umn_quiz_stars_v1', JSON.stringify(initialStars));
    }

    if (savedScore) {
      setTotalScore(parseInt(savedScore));
    }
  }, []);

  // Save progress helper
  const saveQuizProgress = (newProgress: Record<string, number>, newStars: Record<string, Record<number, number>>, additionalPoints: number) => {
    setQuizProgress(newProgress);
    localStorage.setItem('umn_quiz_progress_v1', JSON.stringify(newProgress));
    
    setQuizStars(newStars);
    localStorage.setItem('umn_quiz_stars_v1', JSON.stringify(newStars));

    const newScore = totalScore + additionalPoints;
    setTotalScore(newScore);
    localStorage.setItem('umn_quiz_score_v1', String(newScore));
  };

  // Sound/haptic feedback simulation
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Generate Questions for selected Category & Level (Exactly 3 questions per level)
  const generateQuestionsForLevel = (category: QuizCategory, levelNum: number): QuizQuestion[] => {
    const categoryCurated = CURATED_QUESTIONS[category.id] || [];
    const questionsList: QuizQuestion[] = [];

    // Question 1: From Curated Static Pool
    if (categoryCurated.length > 0) {
      const index = (levelNum - 1) % categoryCurated.length;
      questionsList.push(categoryCurated[index]);
    } else {
      // Fallback if empty
      questionsList.push(CURATED_QUESTIONS['general'][0]);
    }

    // Question 2: From Book Structure Trivia (Dynamic Template 1)
    const templateFn1 = STRUCTURE_TEMPLATES[0];
    const generatedQ2 = templateFn1(levelNum, category.id);
    
    // We need to shuffle options and track correct index
    const originalCorrect = generatedQ2.options[0];
    const shuffledOptions = [...generatedQ2.options].sort(() => Math.sin(levelNum * 2) - 0.5);
    const correctIdx = shuffledOptions.indexOf(originalCorrect);
    questionsList.push({
      question: generatedQ2.question,
      options: shuffledOptions,
      correctIndex: correctIdx,
      explanation: generatedQ2.explanation
    });

    // Question 3: From Sequence/Testament Trivia (Dynamic Template 2 or 3 depending on level)
    const templateFn2 = STRUCTURE_TEMPLATES[levelNum % 2 === 0 ? 1 : 2];
    const generatedQ3 = templateFn2(levelNum, category.id);
    const originalCorrect3 = generatedQ3.options[generatedQ3.correctIndex];
    const shuffledOptions3 = [...generatedQ3.options].sort(() => Math.cos(levelNum * 3) - 0.5);
    const correctIdx3 = shuffledOptions3.indexOf(originalCorrect3);
    questionsList.push({
      question: generatedQ3.question,
      options: shuffledOptions3,
      correctIndex: correctIdx3,
      explanation: generatedQ3.explanation
    });

    return questionsList;
  };

  // Start Level
  const startLevel = (levelNum: number) => {
    const questions = generateQuestionsForLevel(selectedCategory, levelNum);
    setActiveLevelNum(levelNum);
    setActiveQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswered(false);
    setLives(3);
    setLevelScore(0);
    setTimeLeft(20);
    setQuizScreen('play');
    setShowResultModal(false);
    startTimer();
  };

  // Timer Handlers
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(20);
    setTimerRunning(true);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
  };

  const handleTimeOut = () => {
    // Treated as incorrect answer with index -1
    setSelectedAnswerIndex(-1);
    setIsAnswered(true);
    triggerHaptic();
    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        stopTimer();
        setTimeout(() => triggerLevelEnd('lost'), 1500);
      }
      return nextLives;
    });
  };

  // Handle Answer Selection
  const selectAnswer = (optionIdx: number) => {
    if (isAnswered) return;
    
    stopTimer();
    setSelectedAnswerIndex(optionIdx);
    setIsAnswered(true);

    const question = activeQuestions[currentQuestionIndex];
    const isCorrect = optionIdx === question.correctIndex;

    if (isCorrect) {
      triggerHaptic();
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1200);
      setLevelScore(prev => prev + 100 + (timeLeft * 5)); // Base 100 + speed bonus
    } else {
      triggerHaptic();
      setLives(prev => {
        const nextLives = prev - 1;
        if (nextLives <= 0) {
          setTimeout(() => triggerLevelEnd('lost'), 1800);
        }
        return nextLives;
      });
    }
  };

  // Next Question or End Level
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswered(false);
      startTimer();
    } else {
      // Completed last question with lives intact
      if (lives > 0) {
        triggerLevelEnd('won');
      }
    }
  };

  // End Level Trigger
  const triggerLevelEnd = (status: 'won' | 'lost') => {
    stopTimer();
    setResultStatus(status);
    setShowResultModal(true);

    if (status === 'won') {
      // Calculate Stars (3 stars for no life lost, 2 stars for 1 lost, 1 star for 2 lost)
      const starsEarned = lives === 3 ? 3 : (lives === 2 ? 2 : 1);
      
      const currentUnlocked = quizProgress[selectedCategory.id] || 1;
      const currentSavedStars = quizStars[selectedCategory.id]?.[activeLevelNum] || 0;

      // Update state & storage
      const newProgress = { ...quizProgress };
      if (activeLevelNum === currentUnlocked && activeLevelNum < 100) {
        newProgress[selectedCategory.id] = activeLevelNum + 1;
      }

      const newStars = { ...quizStars };
      if (!newStars[selectedCategory.id]) newStars[selectedCategory.id] = {};
      
      let additionalPoints = 0;
      if (starsEarned > currentSavedStars) {
        newStars[selectedCategory.id][activeLevelNum] = starsEarned;
        // Reward 150 points per new star
        additionalPoints = (starsEarned - currentSavedStars) * 150 + levelScore;
      } else {
        additionalPoints = levelScore;
      }

      saveQuizProgress(newProgress, newStars, additionalPoints);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Helpers
  const getMaxUnlocked = (catId: string) => quizProgress[catId] || 1;
  const getStarsForLevel = (catId: string, lvl: number) => quizStars[catId]?.[lvl] || 0;
  
  const getCategoryProgressPercent = (catId: string) => {
    const maxUnlocked = quizProgress[catId] || 1;
    return Math.round(((maxUnlocked - 1) / 100) * 100);
  };

  const getCategoryTotalStars = (catId: string) => {
    const starsObj = quizStars[catId] || {};
    return Object.values(starsObj).reduce((sum: number, s: any) => sum + s, 0);
  };

  return (
    <div className={`h-full flex flex-col select-none ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Dynamic Confetti/Sparkles Layer on Correct Answer */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
          <div className="absolute top-1/4 left-1/4 animate-bounce text-2xl">✨</div>
          <div className="absolute top-1/3 right-1/4 animate-pulse text-3xl">🌟</div>
          <div className="absolute bottom-1/3 left-1/3 animate-bounce text-xl font-bold text-emerald-500">சரியான விடை!</div>
          <div className="absolute bottom-1/4 right-1/3 animate-ping text-2xl">🎉</div>
          <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay transition-all duration-300" />
        </div>
      )}

      {/* HEADER SECTION */}
      <div className={`px-4 py-3 border-b shrink-0 flex items-center justify-between z-10 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (quizScreen === 'play') {
                stopTimer();
                setQuizScreen('levels');
              } else if (quizScreen === 'levels') {
                setQuizScreen('categories');
              } else {
                onBack();
              }
            }}
            className={`p-1.5 rounded-full cursor-pointer hover:bg-opacity-10 transition-all ${isDarkMode ? 'hover:bg-white text-zinc-300' : 'hover:bg-slate-900 text-slate-600'}`}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-500" /> விவிலிய வினாடி-வினா (Quiz)
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">6 பகுதிகள் • 100 லெவல்கள்</p>
          </div>
        </div>

        {/* Global Trophy / XP Meter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/30 text-yellow-500 rounded-full text-xs font-black">
          <Award size={13} className="animate-spin-slow" />
          <span>{totalScore} XP</span>
        </div>
      </div>

      {/* MAIN VIEW */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        
        {/* SCREEN 1: CATEGORY SELECTION */}
        {quizScreen === 'categories' && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden text-white bg-gradient-to-br from-indigo-900 via-purple-950 to-zinc-950 border border-purple-800/30 shadow-md`}>
              <div className="p-2.5 rounded-xl bg-white/10 text-xl">🏆</div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">விளையாட்டுத் தளம்</h4>
                <p className="text-xs text-zinc-100 font-bold leading-tight mt-0.5">உங்கள் விவிலிய அறிவை சோதித்து, 100 லெவல்களையும் முடித்து கிரீடத்தை வெல்லுங்கள்!</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">பிரிவைத் தேர்ந்தெடுக்கவும்</span>
                <span className="text-[10px] text-blue-500 font-bold flex items-center gap-0.5"><Flame size={12} /> XP பாயிண்ட்ஸ்</span>
              </div>

              <div className="space-y-3 pb-8">
                {CATEGORIES.map((cat) => {
                  const maxUnlocked = getMaxUnlocked(cat.id);
                  const percent = getCategoryProgressPercent(cat.id);
                  const stars = getCategoryTotalStars(cat.id);
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setQuizScreen('levels');
                      }}
                      className={`w-full p-4 rounded-2xl text-left border transition-all hover:scale-101 hover:shadow-md cursor-pointer flex gap-3 items-center justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="flex gap-3 items-center flex-1 min-w-0">
                        <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center text-xl bg-slate-100 dark:bg-zinc-800/80`}>
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs tracking-tight truncate">{cat.tamilName}</h4>
                          <p className="text-[9px] text-slate-400 truncate font-semibold">{cat.englishName}</p>
                          
                          {/* Mini Progress Bar */}
                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full bg-gradient-to-r ${cat.gradientClass}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">{percent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Level and Star Badge */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1 pl-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md font-bold text-[9px]">
                          லெவல் {maxUnlocked}
                        </span>
                        <span className="text-[10px] font-black text-yellow-500 flex items-center gap-0.5">
                          <Star size={11} className="fill-yellow-500" /> {stars}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: LEVEL SELECTION (100 LEVELS) */}
        {quizScreen === 'levels' && (
          <div className="p-4 space-y-4 animate-fadeIn flex-1 flex flex-col">
            <div className={`p-4 rounded-2xl flex items-center justify-between border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selectedCategory.icon}</div>
                <div>
                  <h3 className="font-extrabold text-xs text-blue-600 dark:text-blue-400">{selectedCategory.tamilName}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{selectedCategory.englishName}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-yellow-500 flex items-center justify-end gap-0.5">
                  <Star size={12} className="fill-yellow-500" /> {getCategoryTotalStars(selectedCategory.id)}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">மொத்த நட்சத்திரங்கள்</div>
              </div>
            </div>

            {/* Scrolling Level Map/Grid */}
            <div className="flex-1 space-y-3 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center px-1 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">அனைத்து லெவல்கள் (1 - 100)</span>
                <span className="text-[9px] bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">100 லெவல்கள்</span>
              </div>

              {/* Responsive Grid with full levels */}
              <div className="flex-1 overflow-y-auto pb-10 pr-1">
                <div className="grid grid-cols-4 gap-2.5">
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((lvl) => {
                    const isUnlocked = lvl <= getMaxUnlocked(selectedCategory.id);
                    const stars = getStarsForLevel(selectedCategory.id, lvl);
                    
                    return (
                      <button
                        key={lvl}
                        disabled={!isUnlocked}
                        onClick={() => startLevel(lvl)}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative p-1.5 transition-all select-none ${
                          isUnlocked 
                            ? (stars > 0 
                                ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-300 dark:from-amber-950/20 dark:to-zinc-900 dark:border-amber-800 text-amber-900 dark:text-amber-100 hover:scale-105 cursor-pointer shadow-xs' 
                                : `bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:scale-105 cursor-pointer shadow-xs`)
                            : 'bg-slate-100 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-900 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {/* Lock / Unlock Icon */}
                        {!isUnlocked ? (
                          <Lock size={12} className="text-slate-400 dark:text-zinc-700 mb-1" />
                        ) : (
                          <div className="text-[13px] font-black tracking-tight">{lvl}</div>
                        )}

                        {/* Stars Earned */}
                        {isUnlocked && (
                          <div className="flex gap-0.5 mt-1 justify-center">
                            {Array.from({ length: 3 }).map((_, sIdx) => (
                              <Star 
                                key={sIdx} 
                                size={9} 
                                className={sIdx < stars ? "text-yellow-500 fill-yellow-500" : "text-slate-200 dark:text-zinc-800"} 
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Lock label */}
                        {!isUnlocked && <span className="text-[8px] font-bold">பூட்டப்பட்டது</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Play FAB */}
            <div className="absolute bottom-4 left-4 right-4 shrink-0 pointer-events-none flex justify-center">
              <button
                onClick={() => {
                  const fur = getMaxUnlocked(selectedCategory.id);
                  startLevel(fur <= 100 ? fur : 100);
                }}
                className="pointer-events-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-6 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Play size={14} className="fill-white" />
                <span className="text-xs">துரித விளையாட்டு (லெவல் {Math.min(100, getMaxUnlocked(selectedCategory.id))})</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: GAMEPLAY VIEW */}
        {quizScreen === 'play' && activeQuestions.length > 0 && (
          <div className="p-4 flex-1 flex flex-col justify-between animate-fadeIn">
            
            {/* Top Stat Row */}
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                லெவல் {activeLevelNum} • கேள்வி {currentQuestionIndex + 1} / {activeQuestions.length}
              </span>

              {/* Lives (3 Hearts) */}
              <div className="flex gap-1 items-center">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Heart 
                    key={idx} 
                    size={15} 
                    className={`transition-all duration-300 ${
                      idx < lives 
                        ? 'text-red-500 fill-red-500 animate-pulse' 
                        : 'text-slate-300 dark:text-zinc-800'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden shrink-0">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  timeLeft > 10 ? 'bg-emerald-500' : (timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500')
                }`}
                style={{ width: `${(timeLeft / 20) * 100}%` }}
              />
            </div>

            {/* Active Question Box */}
            <div className="flex-1 flex flex-col justify-center my-4 space-y-4">
              <div className={`p-5 rounded-2xl text-center border relative overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="absolute top-2 left-2 text-blue-500 opacity-20">
                  <HelpCircle size={32} />
                </div>
                <h3 className="font-extrabold text-sm leading-relaxed text-slate-800 dark:text-white font-serif">
                  {activeQuestions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* Answers Grid */}
              <div className="space-y-2">
                {activeQuestions[currentQuestionIndex].options.map((opt, oIdx) => {
                  const isCurrentSelected = selectedAnswerIndex === oIdx;
                  const isCorrectAnswer = oIdx === activeQuestions[currentQuestionIndex].correctIndex;
                  
                  let optStyle = isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-slate-200 hover:bg-slate-100';
                  let icon = null;

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      optStyle = 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 scale-101 shadow-sm';
                      icon = <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
                    } else if (isCurrentSelected) {
                      optStyle = 'bg-red-100 dark:bg-red-950/50 border-red-500 text-red-800 dark:text-red-300 scale-99';
                      icon = <X size={14} className="text-red-600 dark:text-red-400 shrink-0" />;
                    } else {
                      optStyle = 'opacity-40';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswered}
                      onClick={() => selectAnswer(oIdx)}
                      className={`w-full p-3.5 text-left text-xs font-semibold rounded-xl border flex justify-between items-center transition-all ${isAnswered ? '' : 'cursor-pointer hover:scale-101'} ${optStyle}`}
                    >
                      <span className="leading-tight">{opt}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanation Panel */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-3.5 rounded-xl border flex items-start gap-2 text-[11px] leading-relaxed ${
                      selectedAnswerIndex === activeQuestions[currentQuestionIndex].correctIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-serif">
                        {activeQuestions[currentQuestionIndex].explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Row / Next button */}
            <div className="h-12 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400">இன்றைய ஸ்கோர்</span>
                <div className="text-xs font-black text-blue-600 dark:text-blue-400">{levelScore} XP</div>
              </div>

              {isAnswered && (
                <button
                  onClick={handleNextQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-103"
                >
                  <span>
                    {currentQuestionIndex + 1 < activeQuestions.length ? 'அடுத்த கேள்வி' : 'விளையாட்டை முடி'}
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* OVERLAY / DIALOGS */}
      <AnimatePresence>
        {showResultModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-sm rounded-3xl p-6 text-center border shadow-2xl relative overflow-hidden ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}
            >
              {resultStatus === 'won' ? (
                <>
                  {/* WIN LAYOUT */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500" />
                  <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 mx-auto rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
                    👑
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">லெவல் {activeLevelNum} வெற்றி!</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">வாழ்த்துகள்! நீங்கள் இந்த லெவலை வெற்றிகரமாக முடித்துவிட்டீர்கள்!</p>
                  
                  {/* Star Rating Render */}
                  <div className="flex gap-2 justify-center my-5">
                    {Array.from({ length: 3 }).map((_, sIdx) => {
                      const earned = sIdx < (lives === 3 ? 3 : (lives === 2 ? 2 : 1));
                      return (
                        <Star 
                          key={sIdx} 
                          size={24} 
                          className={`transition-all duration-500 ${
                            earned 
                              ? 'text-yellow-500 fill-yellow-500 scale-110 drop-shadow-md' 
                              : 'text-slate-200 dark:text-zinc-800'
                          }`} 
                        />
                      );
                    })}
                  </div>

                  {/* Summary Stats */}
                  <div className={`p-4 rounded-2xl grid grid-cols-2 gap-2 mb-6 ${isDarkMode ? 'bg-zinc-950/40' : 'bg-slate-50'}`}>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">சம்பாதித்த புள்ளிகள்</div>
                      <div className="text-sm font-black text-yellow-500">+{levelScore} XP</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">மீதமுள்ள உயிர்கள்</div>
                      <div className="text-sm font-black text-red-500 flex justify-center items-center gap-0.5">
                        <Heart size={12} className="fill-red-500" /> {lives}/3
                      </div>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex flex-col gap-2">
                    {activeLevelNum < 100 && (
                      <button
                        onClick={() => startLevel(activeLevelNum + 1)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all hover:scale-101"
                      >
                        அடுத்த லெவல் {activeLevelNum + 1}
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startLevel(activeLevelNum)}
                        className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        மீண்டும் விளையாடு
                      </button>
                      <button
                        onClick={() => setQuizScreen('levels')}
                        className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        லெவல் மேப்
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* LOST LAYOUT */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
                  <div className="w-16 h-16 bg-red-500/10 text-red-500 mx-auto rounded-full flex items-center justify-center text-3xl mb-4">
                    💀
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">மன்னிக்கவும், தோல்வி!</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">உயிர்கள் அனைத்தும் முடிந்துவிட்டன. மீண்டும் முயற்சி செய்யுங்கள்!</p>

                  <div className="my-5 py-4 border-y border-dashed border-slate-200 dark:border-zinc-800 text-xs">
                    விவிலிய வசனங்களை இன்னும் நன்றாக வாசித்து, கூடுதல் தகவல்களைத் தெரிந்துகொள்ளுங்கள்.
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startLevel(activeLevelNum)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs cursor-pointer shadow-md transition-all hover:scale-101"
                    >
                      <RotateCcw size={12} className="inline mr-1" /> மீண்டும் முயற்சிக்கவும்
                    </button>
                    <button
                      onClick={() => setQuizScreen('levels')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      லெவல் மேப்
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
