/**
 * LanguageContext - Global language state management
 * Supports English, Tamil (தமிழ்), and Hindi (हिन्दी)
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Google Cloud Translation API configuration
const TRANSLATION_API_KEY = 'AIzaSyB4l9Ad9vdWDemxMZAwPCgIaTbhPDeLj-Q';
const TRANSLATION_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

// Supported languages
export const LANGUAGES = {
    en: { code: 'en', name: 'English', native: 'English' },
    ta: { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    hi: { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
};

// Hardcoded Tamil translations
const tamilTranslations = {
    // Navigation
    'Home': 'முகப்பு',
    'Overview': 'கண்ணோட்டம்',
    'Diabetes': 'நீரிழிவு',
    'Hypertension': 'உயர் இரத்த அழுத்தம்',
    'Health Logs': 'சுகாதார பதிவுகள்',
    'Reports': 'அறிக்கைகள்',
    'Settings': 'அமைப்புகள்',
    'Sign Out': 'வெளியேறு',

    // Greetings
    'Good Morning': 'காலை வணக்கம்',
    'Good Afternoon': 'மதிய வணக்கம்',
    'Good Evening': 'மாலை வணக்கம்',
    'Welcome to your health dashboard': 'உங்கள் சுகாதார டாஷ்போர்டுக்கு வரவேற்கிறோம்',

    // Dashboard
    'Your Health Dashboards': 'உங்கள் சுகாதார டாஷ்போர்டுகள்',
    'Select a condition to view detailed care plan and tracking': 'விரிவான கவனிப்பு திட்டம் மற்றும் கண்காணிப்பைக் காண ஒரு நிலையைத் தேர்ந்தெடுக்கவும்',
    'Diabetes Care': 'நீரிழிவு பராமரிப்பு',
    'Hypertension Care': 'உயர் இரத்த அழுத்த பராமரிப்பு',
    'Track blood sugar, manage diet, and follow your care plan': 'இரத்த சர்க்கரையைக் கண்காணிக்கவும், உணவை நிர்வகிக்கவும், உங்கள் கவனிப்பு திட்டத்தைப் பின்பற்றவும்',
    'Monitor BP, track heart rate, and manage your health': 'இரத்த அழுத்தத்தைக் கண்காணிக்கவும், இதய துடிப்பைக் கண்காணிக்கவும், உங்கள் ஆரோக்கியத்தை நிர்வகிக்கவும்',
    'Blood sugar tracking': 'இரத்த சர்க்கரை கண்காணிப்பு',
    'Medication reminders': 'மருந்து நினைவூட்டல்கள்',
    'AI Diet analysis': 'AI உணவு பகுப்பாய்வு',
    'Water intake': 'நீர் உட்கொள்ளல்',
    'Blood pressure readings': 'இரத்த அழுத்த அளவீடுகள்',
    'Heart rate monitoring': 'இதய துடிப்பு கண்காணிப்பு',
    'Low-sodium diet tips': 'குறைந்த சோடியம் உணவு குறிப்புகள்',

    // Quick Overview
    'Quick Overview': 'விரைவு கண்ணோட்டம்',
    'Conditions': 'நிலைமைகள்',
    'Tasks Done Today': 'இன்று செய்த பணிகள்',
    'Last Reading': 'கடைசி அளவீடு',
    'Reminders': 'நினைவூட்டல்கள்',

    // Health Tips
    'Health Tips': 'சுகாதார குறிப்புகள்',
    'Stay hydrated - drink at least 8 glasses of water daily': 'நீரேற்றமாக இருங்கள் - தினமும் குறைந்தது 8 கிளாஸ் தண்ணீர் குடிக்கவும்',
    'Take short walks every hour if you sit for long periods': 'நீண்ட நேரம் உட்கார்ந்திருந்தால் ஒவ்வொரு மணி நேரமும் சிறிய நடைகள் எடுங்கள்',
    'Get 7-8 hours of quality sleep for better health': 'சிறந்த ஆரோக்கியத்திற்கு 7-8 மணி நேரம் தரமான தூக்கம் பெறுங்கள்',

    // Tabs
    'Food & Diet': 'உணவு & உணவுமுறை',
    'Exercise': 'உடற்பயிற்சி',
    'Medications': 'மருந்துகள்',
    'Health Monitor': 'சுகாதார கண்காணிப்பு',
    'Preventive Care': 'தடுப்பு பராமரிப்பு',
    'AI Summary': 'AI சுருக்கம்',
    'Diet & Sodium': 'உணவு & சோடியம்',
    'Stress & Lifestyle': 'மன அழுத்தம் & வாழ்க்கை முறை',

    // Dashboard Cards
    "Today's Progress": 'இன்றைய முன்னேற்றம்',
    "Today's Sugar Readings": 'இன்றைய சர்க்கரை அளவீடுகள்',
    "Today's BP Readings": 'இன்றைய இரத்த அழுத்த அளவீடுகள்',
    "Today's Care Plan": 'இன்றைய கவனிப்பு திட்டம்',
    "Today's Calories": 'இன்றைய கலோரிகள்',
    "Today's Meals": 'இன்றைய உணவுகள்',
    'Quick Actions': 'விரைவு செயல்கள்',
    'Weekly Overview': 'வாராந்திர கண்ணோட்டம்',
    'Weekly Calorie Trend': 'வாராந்திர கலோரி போக்கு',
    'Diabetes Tips': 'நீரிழிவு குறிப்புகள்',
    'Blood Pressure Tips': 'இரத்த அழுத்த குறிப்புகள்',

    // Actions
    'Log Blood Glucose': 'இரத்த குளுக்கோஸ் பதிவு',
    'Log Glucose': 'குளுக்கோஸ் பதிவு',
    'Log Food': 'உணவு பதிவு',
    'Log Activity': 'செயல்பாடு பதிவு',
    'Log Blood Pressure': 'இரத்த அழுத்த பதிவு',
    'Log BP': 'BP பதிவு',
    'Log BP Reading': 'BP அளவீடு பதிவு',
    'Stress Check-in': 'மன அழுத்த சரிபார்ப்பு',
    'Log a Meal': 'உணவு பதிவு செய்',
    'Scan Food Plate': 'உணவு தட்டை ஸ்கேன் செய்',

    // Stats
    'Avg Glucose': 'சராசரி குளுக்கோஸ்',
    'Avg BP': 'சராசரி BP',
    'Avg Pulse': 'சராசரி நாடி',
    'Min': 'குறைந்தபட்சம்',
    'Max': 'அதிகபட்சம்',
    'In Range': 'வரம்பில்',
    'of': 'இல்',
    'tasks done': 'பணிகள் முடிந்தன',

    // Water Tracker
    'Water Intake': 'நீர் உட்கொள்ளல்',
    'Daily Goal: 8 glasses': 'தினசரி இலக்கு: 8 கிளாஸ்',
    'Stay hydrated for better glucose control.': 'சிறந்த குளுக்கோஸ் கட்டுப்பாட்டிற்கு நீரேற்றமாக இருங்கள்.',
    'Add Glass': 'கிளாஸ் சேர்',
    "Today's Intake:": 'இன்றைய உட்கொள்ளல்:',
    'glasses': 'கிளாஸ்',

    // Nutrition
    'Macronutrients': 'பெருஊட்டச்சத்துக்கள்',
    'Carbs': 'கார்போஹைட்ரேட்',
    'Protein': 'புரதம்',
    'Fat': 'கொழுப்பு',
    'Calories': 'கலோரிகள்',
    'Goal': 'இலக்கு',
    'Food': 'உணவு',
    'Remaining': 'மீதம்',
    'Consumed': 'உட்கொண்டது',
    'Breakfast': 'காலை உணவு',
    'Lunch': 'மதிய உணவு',
    'Dinner': 'இரவு உணவு',
    'Snacks': 'சிற்றுண்டிகள்',
    'items logged': 'பொருட்கள் பதிவு செய்யப்பட்டன',
    'kcal': 'கிலோ கலோரி',

    // Common
    'Loading...': 'ஏற்றுகிறது...',
    'Analyzing...': 'பகுப்பாய்வு செய்கிறது...',
    'Cancel': 'ரத்து செய்',
    'Save': 'சேமி',
    'Close': 'மூடு',
    'No readings yet today. Log your first reading!': 'இன்று இன்னும் அளவீடுகள் இல்லை. உங்கள் முதல் அளவீட்டை பதிவு செய்யுங்கள்!',
    'No readings yet today. Log your first BP reading!': 'இன்று இன்னும் அளவீடுகள் இல்லை. உங்கள் முதல் BP அளவீட்டை பதிவு செய்யுங்கள்!',

    // Food Tracking
    'Food & Diet Tracking': 'உணவு & உணவுமுறை கண்காணிப்பு',
    'Track your calories, macros, and get AI-powered nutritional analysis.': 'உங்கள் கலோரிகள், மேக்ரோக்களைக் கண்காணிக்கவும் மற்றும் AI-இயக்கப்படும் ஊட்டச்சத்து பகுப்பாய்வைப் பெறுங்கள்.',
    'DASH Diet Tracking': 'DASH உணவுமுறை கண்காணிப்பு',
    'Track your sodium intake and macros for heart-healthy eating.': 'இதய-ஆரோக்கியமான உணவுக்கு உங்கள் சோடியம் உட்கொள்ளல் மற்றும் மேக்ரோக்களைக் கண்காணிக்கவும்.',

    // Track your blood sugar
    'Track your blood sugar and manage your daily routine': 'உங்கள் இரத்த சர்க்கரையைக் கண்காணிக்கவும் மற்றும் உங்கள் தினசரி வழக்கத்தை நிர்வகிக்கவும்',
    'Monitor your blood pressure and heart health': 'உங்கள் இரத்த அழுத்தம் மற்றும் இதய ஆரோக்கியத்தைக் கண்காணிக்கவும்',

    // Reports Page
    'Health Reports': 'சுகாதார அறிக்கைகள்',
    'View your health trends and export data': 'உங்கள் சுகாதார போக்குகளைப் பார்க்கவும் மற்றும் தரவை ஏற்றுமதி செய்யவும்',
    'Blood Sugar Report': 'இரத்த சர்க்கரை அறிக்கை',
    'View your glucose trends over time': 'காலப்போக்கில் உங்கள் குளுக்கோஸ் போக்குகளைப் பார்க்கவும்',
    'Blood Pressure Report': 'இரத்த அழுத்த அறிக்கை',
    'Track your BP patterns': 'உங்கள் BP வடிவங்களைக் கண்காணிக்கவும்',
    'Activity Report': 'செயல்பாட்டு அறிக்கை',
    'Exercise and activity summary': 'உடற்பயிற்சி மற்றும் செயல்பாட்டு சுருக்கம்',
    'Medication Adherence': 'மருந்து இணக்கம்',
    'Track your medication consistency': 'உங்கள் மருந்து நிலைத்தன்மையைக் கண்காணிக்கவும்',
    'View Report': 'அறிக்கையைக் காண்க',
    'Avg mg/dL': 'சராசரி mg/dL',
    'Readings': 'அளவீடுகள்',
    'Avg/Avg BP': 'சராசரி BP',
    'Total Min': 'மொத்த நிமிடங்கள்',
    'Sessions': 'அமர்வுகள்',
    'Adherence': 'இணக்கம்',
    'Missed': 'தவறியது',

    // Settings Page
    'Language': 'மொழி',
    'Regional & Units': 'பிராந்திய & அலகுகள்',
    'Data & Privacy': 'தரவு & தனியுரிமை',
    'Export Health Data': 'சுகாதார தரவை ஏற்றுமதி செய்',
    'Delete All Data': 'அனைத்து தரவையும் நீக்கு',
    'Notifications': 'அறிவிப்புகள்',
    'Medication Reminders': 'மருந்து நினைவூட்டல்கள்',
    'Health Alerts': 'சுகாதார எச்சரிக்கைகள்',
    'Weekly Summary': 'வாராந்திர சுருக்கம்',
    'Account': 'கணக்கு',
    'Profile Settings': 'சுயவிவர அமைப்புகள்',

    // Export Section
    'Export Your Data': 'உங்கள் தரவை ஏற்றுமதி செய்யுங்கள்',
    'Download your health data for doctor visits': 'மருத்துவர் வருகைகளுக்கு உங்கள் சுகாதார தரவை பதிவிறக்கம் செய்யுங்கள்',
    'Export as PDF': 'PDF ஆக ஏற்றுமதி செய்',
    'Export as CSV': 'CSV ஆக ஏற்றுமதி செய்',
    'Avg BP': 'சராசரி BP',

    // Motivational Messages
    "Let's start your healthy day!": 'உங்கள் ஆரோக்கியமான நாளைத் தொடங்குவோம்!',
    "Great start! Keep going!": 'சிறந்த தொடக்கம்! தொடருங்கள்!',
    "You're on fire! Almost there!": 'நீங்கள் அருமையாக செய்கிறீர்கள்! கிட்டத்தட்ட முடிந்தது!',
    "Amazing! All tasks completed!": 'அற்புதம்! அனைத்து பணிகளும் முடிந்தன!',
    'Next task': 'அடுத்த பணி',
    'All done!': 'எல்லாம் முடிந்தது!',
};

// Hardcoded Hindi translations
const hindiTranslations = {
    // Navigation
    'Home': 'होम',
    'Overview': 'अवलोकन',
    'Diabetes': 'मधुमेह',
    'Hypertension': 'उच्च रक्तचाप',
    'Health Logs': 'स्वास्थ्य लॉग',
    'Reports': 'रिपोर्ट्स',
    'Settings': 'सेटिंग्स',
    'Sign Out': 'लॉग आउट',

    // Greetings
    'Good Morning': 'सुप्रभात',
    'Good Afternoon': 'शुभ दोपहर',
    'Good Evening': 'शुभ संध्या',
    'Welcome to your health dashboard': 'आपके स्वास्थ्य डैशबोर्ड में स्वागत है',

    // Dashboard
    'Your Health Dashboards': 'आपके स्वास्थ्य डैशबोर्ड',
    'Select a condition to view detailed care plan and tracking': 'विस्तृत देखभाल योजना और ट्रैकिंग देखने के लिए एक स्थिति चुनें',
    'Diabetes Care': 'मधुमेह देखभाल',
    'Hypertension Care': 'उच्च रक्तचाप देखभाल',
    'Track blood sugar, manage diet, and follow your care plan': 'रक्त शर्करा ट्रैक करें, आहार प्रबंधित करें, और अपनी देखभाल योजना का पालन करें',
    'Monitor BP, track heart rate, and manage your health': 'बीपी मॉनिटर करें, हृदय गति ट्रैक करें, और अपने स्वास्थ्य का प्रबंधन करें',
    'Blood sugar tracking': 'रक्त शर्करा ट्रैकिंग',
    'Medication reminders': 'दवा रिमाइंडर',
    'AI Diet analysis': 'AI आहार विश्लेषण',
    'Water intake': 'पानी का सेवन',
    'Blood pressure readings': 'रक्तचाप रीडिंग',
    'Heart rate monitoring': 'हृदय गति मॉनिटरिंग',
    'Low-sodium diet tips': 'कम सोडियम आहार टिप्स',

    // Quick Overview
    'Quick Overview': 'त्वरित अवलोकन',
    'Conditions': 'स्थितियां',
    'Tasks Done Today': 'आज किए गए कार्य',
    'Last Reading': 'अंतिम रीडिंग',
    'Reminders': 'रिमाइंडर',

    // Health Tips
    'Health Tips': 'स्वास्थ्य टिप्स',
    'Stay hydrated - drink at least 8 glasses of water daily': 'हाइड्रेटेड रहें - रोजाना कम से कम 8 गिलास पानी पिएं',
    'Take short walks every hour if you sit for long periods': 'अगर आप लंबे समय तक बैठते हैं तो हर घंटे छोटी सैर करें',
    'Get 7-8 hours of quality sleep for better health': 'बेहतर स्वास्थ्य के लिए 7-8 घंटे की गुणवत्तापूर्ण नींद लें',

    // Tabs
    'Food & Diet': 'भोजन और आहार',
    'Exercise': 'व्यायाम',
    'Medications': 'दवाइयां',
    'Health Monitor': 'स्वास्थ्य मॉनिटर',
    'Preventive Care': 'निवारक देखभाल',
    'AI Summary': 'AI सारांश',
    'Diet & Sodium': 'आहार और सोडियम',
    'Stress & Lifestyle': 'तनाव और जीवनशैली',

    // Dashboard Cards
    "Today's Progress": 'आज की प्रगति',
    "Today's Sugar Readings": 'आज की शुगर रीडिंग',
    "Today's BP Readings": 'आज की बीपी रीडिंग',
    "Today's Care Plan": 'आज की देखभाल योजना',
    "Today's Calories": 'आज की कैलोरी',
    "Today's Meals": 'आज का भोजन',
    'Quick Actions': 'त्वरित कार्य',
    'Weekly Overview': 'साप्ताहिक अवलोकन',
    'Weekly Calorie Trend': 'साप्ताहिक कैलोरी ट्रेंड',
    'Diabetes Tips': 'मधुमेह टिप्स',
    'Blood Pressure Tips': 'रक्तचाप टिप्स',

    // Actions
    'Log Blood Glucose': 'ब्लड ग्लूकोज लॉग करें',
    'Log Glucose': 'ग्लूकोज लॉग करें',
    'Log Food': 'भोजन लॉग करें',
    'Log Activity': 'गतिविधि लॉग करें',
    'Log Blood Pressure': 'रक्तचाप लॉग करें',
    'Log BP': 'बीपी लॉग करें',
    'Log BP Reading': 'बीपी रीडिंग लॉग करें',
    'Stress Check-in': 'तनाव चेक-इन',
    'Log a Meal': 'भोजन लॉग करें',
    'Scan Food Plate': 'फूड प्लेट स्कैन करें',

    // Stats
    'Avg Glucose': 'औसत ग्लूकोज',
    'Avg BP': 'औसत बीपी',
    'Avg Pulse': 'औसत पल्स',
    'Min': 'न्यूनतम',
    'Max': 'अधिकतम',
    'In Range': 'रेंज में',
    'of': 'में से',
    'tasks done': 'कार्य पूर्ण',

    // Water Tracker
    'Water Intake': 'पानी का सेवन',
    'Daily Goal: 8 glasses': 'दैनिक लक्ष्य: 8 गिलास',
    'Stay hydrated for better glucose control.': 'बेहतर ग्लूकोज नियंत्रण के लिए हाइड्रेटेड रहें।',
    'Add Glass': 'गिलास जोड़ें',
    "Today's Intake:": 'आज का सेवन:',
    'glasses': 'गिलास',

    // Nutrition
    'Macronutrients': 'मैक्रोन्यूट्रिएंट्स',
    'Carbs': 'कार्ब्स',
    'Protein': 'प्रोटीन',
    'Fat': 'फैट',
    'Calories': 'कैलोरी',
    'Goal': 'लक्ष्य',
    'Food': 'भोजन',
    'Remaining': 'शेष',
    'Consumed': 'सेवन किया',
    'Breakfast': 'नाश्ता',
    'Lunch': 'दोपहर का भोजन',
    'Dinner': 'रात का भोजन',
    'Snacks': 'स्नैक्स',
    'items logged': 'आइटम लॉग किए गए',
    'kcal': 'किलो कैलोरी',

    // Common
    'Loading...': 'लोड हो रहा है...',
    'Analyzing...': 'विश्लेषण हो रहा है...',
    'Cancel': 'रद्द करें',
    'Save': 'सेव करें',
    'Close': 'बंद करें',
    'No readings yet today. Log your first reading!': 'आज अभी तक कोई रीडिंग नहीं है। अपनी पहली रीडिंग लॉग करें!',
    'No readings yet today. Log your first BP reading!': 'आज अभी तक कोई रीडिंग नहीं है। अपनी पहली बीपी रीडिंग लॉग करें!',

    // Food Tracking
    'Food & Diet Tracking': 'भोजन और आहार ट्रैकिंग',
    'Track your calories, macros, and get AI-powered nutritional analysis.': 'अपनी कैलोरी, मैक्रोज़ ट्रैक करें और AI-संचालित पोषण विश्लेषण प्राप्त करें।',
    'DASH Diet Tracking': 'DASH आहार ट्रैकिंग',
    'Track your sodium intake and macros for heart-healthy eating.': 'हृदय-स्वस्थ खाने के लिए अपने सोडियम सेवन और मैक्रोज़ को ट्रैक करें।',

    // Track your blood sugar
    'Track your blood sugar and manage your daily routine': 'अपनी रक्त शर्करा ट्रैक करें और अपनी दैनिक दिनचर्या प्रबंधित करें',
    'Monitor your blood pressure and heart health': 'अपने रक्तचाप और हृदय स्वास्थ्य की निगरानी करें',

    // Reports Page
    'Health Reports': 'स्वास्थ्य रिपोर्ट',
    'View your health trends and export data': 'अपने स्वास्थ्य रुझान देखें और डेटा निर्यात करें',
    'Blood Sugar Report': 'रक्त शर्करा रिपोर्ट',
    'View your glucose trends over time': 'समय के साथ अपने ग्लूकोज रुझान देखें',
    'Blood Pressure Report': 'रक्तचाप रिपोर्ट',
    'Track your BP patterns': 'अपने बीपी पैटर्न ट्रैक करें',
    'Activity Report': 'गतिविधि रिपोर्ट',
    'Exercise and activity summary': 'व्यायाम और गतिविधि सारांश',
    'Medication Adherence': 'दवा अनुपालन',
    'Track your medication consistency': 'अपनी दवा की स्थिरता ट्रैक करें',
    'View Report': 'रिपोर्ट देखें',
    'Avg mg/dL': 'औसत mg/dL',
    'Readings': 'रीडिंग',
    'Avg/Avg BP': 'औसत बीपी',
    'Total Min': 'कुल मिनट',
    'Sessions': 'सत्र',
    'Adherence': 'अनुपालन',
    'Missed': 'छूटा',

    // Settings Page
    'Language': 'भाषा',
    'Regional & Units': 'क्षेत्रीय और इकाइयां',
    'Data & Privacy': 'डेटा और गोपनीयता',
    'Export Health Data': 'स्वास्थ्य डेटा निर्यात करें',
    'Delete All Data': 'सभी डेटा हटाएं',
    'Notifications': 'सूचनाएं',
    'Medication Reminders': 'दवा रिमाइंडर',
    'Health Alerts': 'स्वास्थ्य अलर्ट',
    'Weekly Summary': 'साप्ताहिक सारांश',
    'Account': 'खाता',
    'Profile Settings': 'प्रोफ़ाइल सेटिंग्स',

    // Export Section
    'Export Your Data': 'अपना डेटा निर्यात करें',
    'Download your health data for doctor visits': 'डॉक्टर की विज़िट के लिए अपना स्वास्थ्य डेटा डाउनलोड करें',
    'Export as PDF': 'PDF के रूप में निर्यात करें',
    'Export as CSV': 'CSV के रूप में निर्यात करें',
    'Avg BP': 'औसत बीपी',
};

// Translation cache to reduce API calls
const translationCache = new Map();

// Create context
const LanguageContext = createContext();

/**
 * Translate text using Google Cloud Translation API
 */
async function translateText(text, targetLang) {
    // Skip if English or empty
    if (targetLang === 'en' || !text || text.trim() === '') {
        return text;
    }

    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    try {
        const response = await fetch(`${TRANSLATION_ENDPOINT}?key=${TRANSLATION_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLang,
                source: 'en'
            })
        });

        if (!response.ok) {
            console.error('Translation API error:', response.status);
            return text;
        }

        const data = await response.json();
        const translatedText = data.data?.translations?.[0]?.translatedText || text;

        // Cache the result
        translationCache.set(cacheKey, translatedText);

        return translatedText;
    } catch (error) {
        console.error('Translation failed:', error);
        return text;
    }
}

/**
 * Batch translate multiple texts
 */
async function translateBatch(texts, targetLang) {
    if (targetLang === 'en' || !texts || texts.length === 0) {
        return texts;
    }

    // Check which texts need translation
    const toTranslate = [];
    const results = new Array(texts.length);

    texts.forEach((text, index) => {
        const cacheKey = `${text}_${targetLang}`;
        if (translationCache.has(cacheKey)) {
            results[index] = translationCache.get(cacheKey);
        } else if (text && text.trim()) {
            toTranslate.push({ text, index });
        } else {
            results[index] = text;
        }
    });

    if (toTranslate.length === 0) {
        return results;
    }

    try {
        const response = await fetch(`${TRANSLATION_ENDPOINT}?key=${TRANSLATION_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: toTranslate.map(item => item.text),
                target: targetLang,
                source: 'en'
            })
        });

        if (!response.ok) {
            // Fill with originals on error
            toTranslate.forEach(item => {
                results[item.index] = item.text;
            });
            return results;
        }

        const data = await response.json();
        const translations = data.data?.translations || [];

        toTranslate.forEach((item, i) => {
            const translated = translations[i]?.translatedText || item.text;
            results[item.index] = translated;
            // Cache it
            translationCache.set(`${item.text}_${targetLang}`, translated);
        });

        return results;
    } catch (error) {
        console.error('Batch translation failed:', error);
        toTranslate.forEach(item => {
            results[item.index] = item.text;
        });
        return results;
    }
}

/**
 * LanguageProvider component
 */
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        // Load from localStorage or default to English
        return localStorage.getItem('healthbuddy_language') || 'en';
    });
    const [isTranslating, setIsTranslating] = useState(false);
    const [translatedStrings, setTranslatedStrings] = useState({});

    // Save language preference to localStorage
    useEffect(() => {
        localStorage.setItem('healthbuddy_language', language);
    }, [language]);

    // Common UI strings to pre-translate
    const commonStrings = {
        // Greetings
        'Good Morning': 'Good Morning',
        'Good Afternoon': 'Good Afternoon',
        'Good Evening': 'Good Evening',
        'Welcome to your health dashboard': 'Welcome to your health dashboard',

        // Navigation
        'Home': 'Home',
        'Overview': 'Overview',
        'Diabetes': 'Diabetes',
        'Hypertension': 'Hypertension',
        'Health Logs': 'Health Logs',
        'Reports': 'Reports',
        'Settings': 'Settings',
        'Sign Out': 'Sign Out',

        // Dashboard headers & reports
        'Diabetes Care': 'Diabetes Care',
        'Hypertension Care': 'Hypertension Care',
        'Health Reports': 'Health Reports',
        'View your health trends and export data': 'View your health trends and export data',
        'Blood Sugar Report': 'Blood Sugar Report',
        'View your glucose trends over time': 'View your glucose trends over time',
        'Blood Pressure Report': 'Blood Pressure Report',
        'Track your BP patterns': 'Track your BP patterns',
        'Activity Report': 'Activity Report',
        'Exercise and activity summary': 'Exercise and activity summary',
        'Medication Adherence': 'Medication Adherence',
        'Track your medication consistency': 'Track your medication consistency',
        'Export Your Data': 'Export Your Data',
        'Download your health data for doctor visits': 'Download your health data for doctor visits',
        'Export as PDF': 'Export as PDF',
        'Export as CSV': 'Export as CSV',
        'Avg mg/dL': 'Avg mg/dL',
        'Readings': 'Readings',
        'Avg BP': 'Avg BP',
        'Total Min': 'Total Min',
        'Sessions': 'Sessions',
        'Adherence': 'Adherence',
        'Missed': 'Missed',
        'View Report': 'View Report',

        // Settings
        'Manage your preferences and account': 'Manage your preferences and account',
        'Profile Information': 'Profile Information',
        'Name': 'Name',
        'Language': 'Language',
        'Regional & Units': 'Regional & Units',
        'Email': 'Email',
        'Age': 'Age',
        'Measurement Units': 'Measurement Units',
        'Blood Sugar Unit': 'Blood Sugar Unit',
        'Connected Apps': 'Connected Apps',
        'Notifications': 'Notifications',
        'Get notified when it\'s time to take medication': 'Get notified when it\'s time to take medication',
        'ON': 'ON',
        'OFF': 'OFF',
        'Account': 'Account',
        'Made with': 'Made with',
        'for better health management': 'for better health management',

        // Health Logs
        'View all your health entries': 'View all your health entries',
        'All': 'All',
        'Glucose': 'Glucose',
        'BP': 'BP',
        'Food': 'Food',
        'Activity': 'Activity',
        'Water': 'Water',
        'No logs found for the selected filter.': 'No logs found for the selected filter.',
        'Start logging your health data to see entries here.': 'Start logging your health data to see entries here.',
        'min': 'min',

        // Modals - Common
        'Cancel': 'Cancel',
        'Save Log': 'Save Log',
        'Saving...': 'Saving...',
        'Loading...': 'Loading...',
        'Translating...': 'Translating...',
        'Analyzing...': 'Analyzing...',
        'Done': 'Done',
        'Close': 'Close',
        'Health Alert': 'Health Alert',
        'I Understand': 'I Understand',
        'Notes (optional)': 'Notes (optional)',
        'Any additional notes...': 'Any additional notes...',
        'This is not medical advice. Always consult your healthcare provider.': 'This is not medical advice. Always consult your healthcare provider.',

        // Modals - Log Entry
        'Log Blood Glucose': 'Log Blood Glucose',
        'Log Blood Pressure': 'Log Blood Pressure',
        'Log Food Intake': 'Log Food Intake',
        'Blood Glucose (mg/dL)': 'Blood Glucose (mg/dL)',
        'Reading Type': 'Reading Type',
        'Fasting (before meal)': 'Fasting (before meal)',
        'After Meal': 'After Meal',
        'Random': 'Random',
        'Bedtime': 'Bedtime',
        'Systolic (top number)': 'Systolic (top number)',
        'Diastolic (bottom number)': 'Diastolic (bottom number)',
        'Meal Type': 'Meal Type',
        'Breakfast': 'Breakfast',
        'Lunch': 'Lunch',
        'Dinner': 'Dinner',
        'Snack': 'Snack',
        'Calories (estimated)': 'Calories (estimated)',
        'Description (optional)': 'Description (optional)',
        'Activity Type': 'Activity Type',
        'Walking': 'Walking',
        'Running': 'Running',
        'Cycling': 'Cycling',
        'Swimming': 'Swimming',
        'Yoga': 'Yoga',
        'Strength Training': 'Strength Training',
        'Stretching': 'Stretching',
        'Other': 'Other',
        'Duration (minutes)': 'Duration (minutes)',
        'Intensity': 'Intensity',
        'Light': 'Light',
        'Moderate': 'Moderate',
        'Vigorous': 'Vigorous',

        // Modals - Food AI
        'AI Food Analysis': 'AI Food Analysis',
        'Analyze Food': 'Analyze Food',
        'What did you eat?': 'What did you eat?',
        'Quantity/Portion': 'Quantity/Portion',
        'Small serving': 'Small serving',
        'Half serving': 'Half serving',
        '1 serving (regular)': '1 serving (regular)',
        'Large serving': 'Large serving',
        '2 servings': '2 servings',
        'Nutritional Analysis': 'Nutritional Analysis',
        'Calories': 'Calories',
        'Carbs': 'Carbs',
        'Sugar': 'Sugar',
        'Fiber': 'Fiber',
        'Protein': 'Protein',
        'GI': 'GI',
        'Glucose Spike Risk:': 'Glucose Spike Risk:',
        'Meal Rating:': 'Meal Rating:',

        // Modals - Prescription
        'Upload Prescription': 'Upload Prescription',
        'Analyzing prescription...': 'Analyzing prescription...',
        'AI is detecting medications': 'AI is detecting medications',
        'Click to upload prescription': 'Click to upload prescription',
        'Supports JPG, PNG images': 'Supports JPG, PNG images',
        'Tips for best results:': 'Tips for best results:',
        'Ensure prescription is clearly visible': 'Ensure prescription is clearly visible',
        'Good lighting helps accuracy': 'Good lighting helps accuracy',
        'Include medication names and dosages': 'Include medication names and dosages',
        'Detected {count} medication(s)': 'Detected {count} medication(s)',
        'Review and edit before adding': 'Review and edit before adding',
        'Medication name': 'Medication name',
        'Dosage': 'Dosage',
        'Once daily': 'Once daily',
        'Twice daily': 'Twice daily',
        'Three times daily': 'Three times daily',
        '3x daily': '3x daily',
        'As needed': 'As needed',
        'Add {count} Medication(s)': 'Add {count} Medication(s)',
        'AI detection may not be 100% accurate. Please verify all medications before adding.': 'AI detection may not be 100% accurate. Please verify all medications before adding.',

        // Tabs
        'Food & Diet': 'Food & Diet',
        'Diet & Sodium': 'Diet & Sodium',
        'Exercise': 'Exercise',
        'Medications': 'Medications',
        'Health Monitor': 'Health Monitor',
        'Preventive Care': 'Preventive Care',
        'AI Summary': 'AI Summary',
        'Stress & Lifestyle': 'Stress & Lifestyle',

        // Quick Actions
        'Quick Actions': 'Quick Actions',

        // Quick Overview
        'Quick Overview': 'Quick Overview',
        'Conditions': 'Conditions',
        'Tasks Done Today': 'Tasks Done Today',
        'Last Reading': 'Last Reading',
        'Reminders': 'Reminders',

        // Health Tips
        'Health Tips': 'Health Tips',
        'Stay hydrated - drink at least 8 glasses of water daily': 'Stay hydrated - drink at least 8 glasses of water daily',
        'Take short walks every hour if you sit for long periods': 'Take short walks every hour if you sit for long periods',
        'Get 7-8 hours of quality sleep for better health': 'Get 7-8 hours of quality sleep for better health',

        // Home
        'Your Health Dashboards': 'Your Health Dashboards',
        'Select a condition to view detailed care plan and tracking': 'Select a condition to view detailed care plan and tracking',
        'Track blood sugar, manage diet, and follow your care plan': 'Track blood sugar, manage diet, and follow your care plan',
        'Monitor BP, track heart rate, and manage your health': 'Monitor BP, track heart rate, and manage your health',
        'Blood sugar tracking': 'Blood sugar tracking',
        'Medication reminders': 'Medication reminders',
        'AI Diet analysis': 'AI Diet analysis',
        'Water intake': 'Water intake',
        'Blood pressure readings': 'Blood pressure readings',
        'Heart rate monitoring': 'Heart rate monitoring',
        'Low-sodium diet tips': 'Low-sodium diet tips',

        'Today\'s Progress': 'Today\'s Progress',
        'Today\'s Sugar Readings': 'Today\'s Sugar Readings',
        'Today\'s BP Readings': 'Today\'s BP Readings',
        'Today\'s Care Plan': 'Today\'s Care Plan',
        'Log BP': 'Log BP',
        'Log BP Reading': 'Log BP Reading',
        'Log Food': 'Log Food',
        'Log Activity': 'Log Activity',
        'Log Blood Pressure': 'Log Blood Pressure',
        'Log Blood Glucose': 'Log Blood Glucose',
        'Log Glucose': 'Log Glucose',
        'Stress Check-in': 'Stress Check-in',
        'No readings yet today. Log your first reading!': 'No readings yet today. Log your first reading!',
        'No readings yet today. Log your first BP reading!': 'No readings yet today. Log your first BP reading!',
        'of': 'of',
        'tasks done': 'tasks done',
        'Calories': 'Calories',
        'Day': 'Day',
        'items logged': 'items logged',
        'Avg Glucose': 'Avg Glucose',
        'Min': 'Min',
        'Max': 'Max',
        'Avg Pulse': 'Avg Pulse',
        'In Range': 'In Range',
        'Blood Pressure Tips': 'Blood Pressure Tips',

        // BP Categories & Messages
        'Hypertensive Crisis': 'Hypertensive Crisis',
        'URGENT: Seek immediate medical attention!': 'URGENT: Seek immediate medical attention!',
        'Stage 2 Hypertension': 'Stage 2 Hypertension',
        'High blood pressure. Consult your doctor about medication adjustments.': 'High blood pressure. Consult your doctor about medication adjustments.',
        'Stage 1 Hypertension': 'Stage 1 Hypertension',
        'Elevated. Focus on lifestyle modifications.': 'Elevated. Focus on lifestyle modifications.',
        'Slightly elevated. Monitor regularly and maintain healthy habits.': 'Slightly elevated. Monitor regularly and maintain healthy habits.',
        'Great! Your blood pressure is in the healthy range.': 'Great! Your blood pressure is in the healthy range.',
        'Your blood pressure reading is dangerously high.': 'Your blood pressure reading is dangerously high.',
        'Please seek immediate medical attention or call emergency services.': 'Please seek immediate medical attention or call emergency services.',
        'BP Categories (AHA Guidelines)': 'BP Categories (AHA Guidelines)',
        'Systolic (upper)': 'Systolic (upper)',
        'Diastolic (lower)': 'Diastolic (lower)',
        'Pulse Rate (optional)': 'Pulse Rate (optional)',
        'Save Reading': 'Save Reading',

        // Disease Information Modal
        'Health Information': 'Health Information',
        'Please provide your health details for personalized care recommendations.': 'Please provide your health details for personalized care recommendations.',
        'Select...': 'Select...',
        'Save Information': 'Save Information',
        'Fasting Blood Sugar (mg/dL)': 'Fasting Blood Sugar (mg/dL)',
        'HbA1c Level (%)': 'HbA1c Level (%)',
        'Using Insulin?': 'Using Insulin?',
        'Last Doctor Visit': 'Last Doctor Visit',
        'Systolic Blood Pressure (mmHg)': 'Systolic Blood Pressure (mmHg)',
        'Diastolic Blood Pressure (mmHg)': 'Diastolic Blood Pressure (mmHg)',
        'Total Cholesterol (mg/dL)': 'Total Cholesterol (mg/dL)',
        'LDL Cholesterol (mg/dL)': 'LDL Cholesterol (mg/dL)',
        'Heart Condition': 'Heart Condition',
        'Current Medications': 'Current Medications',
        'On BP Medication?': 'On BP Medication?',
        'Medication Name (if any)': 'Medication Name (if any)',
        'Family History of Hypertension?': 'Family History of Hypertension?',
        'Salt Intake Level': 'Salt Intake Level',

        // DASH Diet & Sodium
        'DASH Diet Food Analysis': 'DASH Diet Food Analysis',
        'Analyze for Sodium': 'Analyze for Sodium',
        'Nutritional Analysis (DASH Focus)': 'Nutritional Analysis (DASH Focus)',
        'Sodium': 'Sodium',
        'Potassium': 'Potassium',
        'Sat. Fat': 'Sat. Fat',
        'Saturated Fat': 'Saturated Fat',
        'High Sodium Alert': 'High Sodium Alert',
        'This meal is high in sodium. Consider reducing processed foods and adding more fresh vegetables.': 'This meal is high in sodium. Consider reducing processed foods and adding more fresh vegetables.',
        'DASH Diet Compliance:': 'DASH Diet Compliance:',
        'Today\'s Sodium Intake': 'Today\'s Sodium Intake',
        '{amount}mg consumed': '{amount}mg consumed',
        'Target: <2,300mg': 'Target: <2,300mg',
        'AI estimates are approximate. Actual values may vary.': 'AI estimates are approximate. Actual values may vary.',
        'Low': 'Low',
        'Moderate': 'Moderate',
        'High': 'High',

        // Medication Manager
        'Medications': 'Medications',
        'Add Medication': 'Add Medication',
        'Medication Name': 'Medication Name',
        'Dosage': 'Dosage',
        'Frequency': 'Frequency',
        'Times of Day': 'Times of Day',
        'Add Time': 'Add Time',
        'Save Medication': 'Save Medication',
        'No medications added yet.': 'No medications added yet.',
        'Add your doctor-prescribed medications to track them.': 'Add your doctor-prescribed medications to track them.',
        'Do not modify dosage without consulting your doctor.': 'Do not modify dosage without consulting your doctor.',
        'Are you sure you want to delete this medication?': 'Are you sure you want to delete this medication?',
        'Once daily': 'Once daily',
        'Twice daily': 'Twice daily',
        'Three times daily': 'Three times daily',
        '3x daily': '3x daily',
        'As needed': 'As needed',
        'Take with food': 'Take with food',
        'e.g., Metformin': 'e.g., Metformin',
        'e.g., 500mg': 'e.g., 500mg',

        // Water Tracker
        'Water Intake': 'Water Intake',
        'Stay hydrated for better glucose control.': 'Stay hydrated for better glucose control.',
        'glasses': 'glasses',
        'Today\'s Intake:': 'Today\'s Intake:',
        'Daily Goal: 8 glasses': 'Daily Goal: 8 glasses',
        'Add {n} glasses': 'Add {n} glasses',
        'Add Glass': 'Add Glass',

        // Nutrition Dashboard
        'Today\'s Calories': 'Today\'s Calories',
        'Macronutrients': 'Macronutrients',
        'Weekly Calorie Trend': 'Weekly Calorie Trend',
        'Today\'s Meals': 'Today\'s Meals',
        'kcal': 'kcal',
        'Goal': 'Goal',
        'Food': 'Food',
        'Exercise': 'Exercise',
        'Remaining': 'Remaining',
        '{percentage}% of daily goal': '{percentage}% of daily goal',
        'Carbs': 'Carbs',
        'Protein': 'Protein',
        'Fat': 'Fat',
        'Consumed': 'Consumed',
        'items logged': 'items logged',
        'Food item': 'Food item',
        'Breakfast': 'Breakfast',
        'Lunch': 'Lunch',
        'Dinner': 'Dinner',
        'Snacks': 'Snacks',
        'Snack': 'Snack',

        // Weekly Summary Ratings & Trends
        'Weekly Health Summary': 'Weekly Health Summary',
        'Week of {date}': 'Week of {date}',
        'Excellent': 'Excellent',
        'Good': 'Good',
        'Fair': 'Fair',
        'Needs Improvement': 'Needs Improvement',
        'improving': 'improving',
        'stable': 'stable',
        'worsening': 'worsening',
        'meals logged': 'meals logged',
        'min / {target} min': 'min / {target} min',
        '% adherence': '% adherence',
        'in range': 'in range',
        'AI Insights & Suggestions': 'AI Insights & Suggestions',
        'No data available yet. Start logging your health data to see insights.': 'No data available yet. Start logging your health data to see insights.',
        'Avg: {value} mg/dL': 'Avg: {value} mg/dL',
        'Avg: {value} kcal/meal': 'Avg: {value} kcal/meal',
        'No readings this week': 'No readings this week',
        'Range: {min} - {max}': 'Range: {min} - {max}',
        '% in range': '% in range',
        'Avg: {avg} mg/dL': 'Avg: {avg} mg/dL',
        'Diet': 'Diet',
        'Exercise': 'Exercise',
        'Blood Sugar': 'Blood Sugar',
        'Blood Pressure': 'Blood Pressure',
        'Medications': 'Medications',
        'Avg: {avg} mmHg': 'Avg: {avg} mmHg',
        'High readings: {count}': 'High readings: {count}',
        'Total water: {amount} glasses': 'Total water: {amount} glasses',
        'Daily avg: {amount} glasses': 'Daily avg: {amount} glasses',
        'Trend': 'Trend',
        'Reading Count': 'Reading Count',

        // Hypertension Summary Specifics
        'AI Weekly Summary': 'AI Weekly Summary',
        'Refresh': 'Refresh',
        'Blood Pressure Trend': 'Blood Pressure Trend',
        'This Week\'s Trend': 'This Week\'s Trend',
        'Not enough data': 'Not enough data',
        'Avg BP': 'Avg BP',
        'Readings': 'Readings',
        'In Range': 'In Range',
        'of scheduled doses taken': 'of scheduled doses taken',
        'Great job!': 'Great job!',
        'Try to improve consistency': 'Try to improve consistency',
        'Diet - Sodium Levels': 'Diet - Sodium Levels',
        'Avg Daily Sodium': 'Avg Daily Sodium',
        'Target: <2,300mg/day': 'Target: <2,300mg/day',
        'On Track': 'On Track',
        'Reduce sodium': 'Reduce sodium',
        'Physical Activity': 'Physical Activity',
        'Minutes this week': 'Minutes this week',
        'Goal: 150 min/week (AHA)': 'Goal: 150 min/week (AHA)',
        'Goal Met!': 'Goal Met!',
        'min remaining': 'min remaining',
        'Attention Required': 'Attention Required',
        'AI insights are informational only. They are not medical advice and do not replace consultation with your healthcare provider.': 'AI insights are informational only. They are not medical advice and do not replace consultation with your healthcare provider.',
        'Not enough data to generate a weekly summary yet.': 'Not enough data to generate a weekly summary yet.',
        'Keep logging your blood pressure, meals, and activities to get personalized insights!': 'Keep logging your blood pressure, meals, and activities to get personalized insights!',
        'Generate Summary': 'Generate Summary',
        'Refreshing...': 'Refreshing...',

        // Exercise Tracker
        'Exercise Tracker': 'Exercise Tracker',
        'Weekly Goal Progress': 'Weekly Goal Progress',
        'Sessions': 'Sessions',
        'Avg min/day': 'Avg min/day',
        'ADA recommends 150+ minutes of moderate exercise per week for diabetes management': 'ADA recommends 150+ minutes of moderate exercise per week for diabetes management',
        'Activity Type': 'Activity Type',
        'Walking': 'Walking',
        'Jogging': 'Jogging',
        'Cycling': 'Cycling',
        'Swimming': 'Swimming',
        'Yoga': 'Yoga',
        'Strength': 'Strength',
        'Dancing': 'Dancing',
        'Duration (minutes)': 'Duration (minutes)',
        'Intensity': 'Intensity',
        'Light': 'Light',
        'Moderate': 'Moderate',
        'Vigorous': 'Vigorous',
        'Recent Activities': 'Recent Activities',
        'No exercises logged yet this week.': 'No exercises logged yet this week.',
        'Start tracking your activity to see your progress!': 'Start tracking your activity to see your progress!',
        'Benefits for Diabetics': 'Benefits for Diabetics',
        'Improves insulin sensitivity': 'Improves insulin sensitivity',
        'Helps control blood sugar levels': 'Helps control blood sugar levels',
        'Reduces cardiovascular risk': 'Reduces cardiovascular risk',
        'Supports healthy weight management': 'Supports healthy weight management',
        'Intensity:': 'Intensity:',
        'min': 'min',
        'Benefits for Hypertension': 'Benefits for Hypertension',
        'Lowers systolic blood pressure': 'Lowers systolic blood pressure',
        'Strengthens heart muscle': 'Strengthens heart muscle',
        'Reduces arterial stiffness': 'Reduces arterial stiffness',
        'Helps maintain healthy weight': 'Helps maintain healthy weight',
        'Weight Logged': 'Weight Logged',
        'Physical Activity Tracking': 'Physical Activity Tracking',
        'Workout Analytics': 'Workout Analytics',

        // Activity Tracker & Strava
        'Strava Activities': 'Strava Activities',
        'Synced': 'Synced',
        'km Total': 'km Total',
        'of Goal': 'of Goal',
        'This Week': 'This Week',
        'No activities synced yet this week.': 'No activities synced yet this week.',
        'Go to Settings to connect and sync your Strava account!': 'Go to Settings to connect and sync your Strava account!',
        '{n} more minutes to reach your weekly goal!': '{n} more minutes to reach your weekly goal!',
        'You\'ve exceeded your goal by {n} minutes! 🎉': 'You\'ve exceeded your goal by {n} minutes! 🎉',
        'Today': 'Today',
        'Yesterday': 'Yesterday',
        '{n} days ago': '{n} days ago',
        'Run': 'Run',
        'Ride': 'Ride',
        'Swim': 'Swim',
        'Walk': 'Walk',
        'Hike': 'Hike',
        'Workout': 'Workout',
        'VirtualRide': 'VirtualRide',
        'VirtualRun': 'VirtualRun',
        'Goal!': 'Goal!',
        'Loading Strava activities...': 'Loading Strava activities...',

        // Stress Tracker
        'Stress & Lifestyle': 'Stress & Lifestyle',
        'How are you feeling today?': 'How are you feeling today?',
        'Last Night\'s Sleep': 'Last Night\'s Sleep',
        'Quick Stress Relief': 'Quick Stress Relief',
        'Start 4-4-6 Breathing Exercise': 'Start 4-4-6 Breathing Exercise',
        'Breathe In': 'Breathe In',
        'Hold': 'Hold',
        'Breathe Out': 'Breathe Out',
        'Cycle {n} of 3': 'Cycle {n} of 3',
        'Deep breathing activates your parasympathetic nervous system and can help lower blood pressure.': 'Deep breathing activates your parasympathetic nervous system and can help lower blood pressure.',
        'Lifestyle Tips for BP Control': 'Lifestyle Tips for BP Control',
        'Avoid smoking - it raises blood pressure': 'Avoid smoking - it raises blood pressure',
        'Limit alcohol - max 1 drink/day for women, 2 for men': 'Limit alcohol - max 1 drink/day for women, 2 for men',
        'Reduce caffeine - can temporarily spike BP': 'Reduce caffeine - can temporarily spike BP',
        'Get 7-8 hours of quality sleep': 'Get 7-8 hours of quality sleep',
        'Practice relaxation techniques daily': 'Practice relaxation techniques daily',
        'This Week\'s Stress': 'This Week\'s Stress',
        'Low Days': 'Low Days',
        'Moderate Days': 'Moderate Days',
        'High Days': 'High Days',
        'Less than 7 hours. Poor sleep can raise blood pressure.': 'Less than 7 hours. Poor sleep can raise blood pressure.',
        'hours': 'hours',
        'Check-in Recorded': 'Check-in Recorded',

        // Health Monitor
        'Health Monitor': 'Health Monitor',
        'HbA1c Tracking': 'HbA1c Tracking',
        'Log HbA1c': 'Log HbA1c',
        'HbA1c Value (%)': 'HbA1c Value (%)',
        'Test Date': 'Test Date',
        'Lab Name (optional)': 'Lab Name (optional)',
        'Save HbA1c Result': 'Save HbA1c Result',
        'History': 'History',
        'Target:': 'Target:',
        'Last test:': 'Last test:',
        'AI Health Insights': 'AI Health Insights',
        'Get AI Analysis': 'Get AI Analysis',
        'Overall Health Status': 'Overall Health Status',
        'Areas to Watch': 'Areas to Watch',
        'Personalized Recommendations': 'Personalized Recommendations',
        'Positive Trends': 'Positive Trends',
        'Could not load AI insights. Please try again.': 'Could not load AI insights. Please try again.',
        'Click "Get AI Analysis" to receive personalized health insights based on your data.': 'Click "Get AI Analysis" to receive personalized health insights based on your data.',
        'Recommended Tests': 'Recommended Tests',
        'Kidney Function (eGFR)': 'Kidney Function (eGFR)',
        'Cholesterol Panel': 'Cholesterol Panel',
        'Triglycerides': 'Triglycerides',
        'Eye Exam': 'Eye Exam',
        'Foot Exam': 'Foot Exam',
        'Every 3-6 months': 'Every 3-6 months',
        'Annually': 'Annually',
        'At each visit': 'At each visit',
        'Analyzed': 'Analyzed',

        // Preventive Care & Travel
        'Preventive Care': 'Preventive Care',
        'Daily Reminders': 'Daily Reminders',
        'Travel Checklist': 'Travel Checklist',
        'Travel Safety Checklist': 'Travel Safety Checklist',
        'GP Letter Template': 'GP Letter Template',
        'Copy this template and have your doctor sign it before traveling.': 'Copy this template and have your doctor sign it before traveling.',
        'Copy to Clipboard': 'Copy to Clipboard',
        'Letter copied to clipboard!': 'Letter copied to clipboard!',
        'Lifestyle Tips': 'Lifestyle Tips',
        'Avoid Smoking': 'Avoid Smoking',
        'Smoking increases diabetes complications risk': 'Smoking increases diabetes complications risk',
        'Limit Alcohol': 'Limit Alcohol',
        'Alcohol can affect blood sugar levels': 'Alcohol can affect blood sugar levels',
        'High-Fiber Diet': 'High-Fiber Diet',
        'Fiber helps control blood sugar spikes': 'Fiber helps control blood sugar spikes',
        'High-Protein Foods': 'High-Protein Foods',
        'Protein helps maintain stable glucose': 'Protein helps maintain stable glucose',
        'Quality Sleep': 'Quality Sleep',
        '7-8 hours helps insulin sensitivity': '7-8 hours helps insulin sensitivity',
        'Stress Management': 'Stress Management',
        'Stress raises blood sugar levels': 'Stress raises blood sugar levels',
        'Travel Safety': 'Travel Safety',
        'Foot Care': 'Foot Care',
        'Medical Alert ID': 'Medical Alert ID',
        'Emergency Contact': 'Emergency Contact',

        // Login & Signup
        'Welcome Back!': 'Welcome Back!',
        'Sign in to continue your wellness journey': 'Sign in to continue your wellness journey',
        'Email Address *': 'Email Address *',
        'Password *': 'Password *',
        'Remember me': 'Remember me',
        'Forgot password?': 'Forgot password?',
        'Sign In': 'Sign In',
        'Signing In...': 'Signing In...',
        'Don\'t have an account?': 'Don\'t have an account?',
        'Create Account': 'Create Account',
        'Sign in to access your dashboard': 'Sign in to access your dashboard',
        'Please enter your email': 'Please enter your email',
        'Please enter your password': 'Please enter your password',
        'Login failed': 'Login failed',
        'Invalid credentials. Please try again.': 'Invalid credentials. Please try again.',
        'you@example.com': 'you@example.com',
        'or': 'or',
        'Joint Health': 'Joint Health',
        'Create your health profile and start your journey.': 'Create your health profile and start your journey.',
        'Full Name *': 'Full Name *',
        'Your Name': 'Your Name',
        'Confirm Password *': 'Confirm Password *',
        'I agree to the Terms & Privacy Policy': 'I agree to the Terms & Privacy Policy',
        'Creating Account...': 'Creating Account...',
        'Step {n}: Account Details': 'Step {n}: Account Details',
        'Step {n}: Health Information': 'Step {n}: Health Information',
        'Back': 'Back',
        'Finish': 'Finish',
        'Already have an account?': 'Already have an account?',
        'Login': 'Login',
        'Please agree to the Terms & Privacy Policy': 'Please agree to the Terms & Privacy Policy',
        'Passwords do not match': 'Passwords do not match',
        'Registration failed': 'Registration failed',
        'Account created successfully!': 'Account created successfully!',

        // Branding & Signup Specifics
        'Create Your Account': 'Create Your Account',
        'Start your wellness journey today': 'Start your wellness journey today',
        'Enter your name': 'Enter your name',
        'Confirm *': 'Confirm *',
        'Age *': 'Age *',
        'Gender *': 'Gender *',
        'Select...': 'Select...',
        'Male': 'Male',
        'Female': 'Female',
        'Other': 'Other',
        'Select Your Health Condition(s) *': 'Select Your Health Condition(s) *',
        'Click to select, then add your health information': 'Click to select, then add your health information',
        '✓ Info Added - Edit': '✓ Info Added - Edit',
        '+ Add Health Info': '+ Add Health Info',
        'Please enter your name': 'Please enter your name',
        'Password must be at least 6 characters': 'Password must be at least 6 characters',
        'Please enter a valid age': 'Please enter a valid age',
        'Please select your gender': 'Please select your gender',
        'Please select at least one health condition': 'Please select at least one health condition',
        'Please add health information for {disease}': 'Please add health information for {disease}',
        'Signup failed': 'Signup failed',
        'Something went wrong. Please try again.': 'Something went wrong. Please try again.',
        'Personalized care plans': 'Personalized care plans',
        'Track your progress': 'Track your progress',
        'Timely reminders': 'Timely reminders',
        'Users': 'Users',
        'Happy': 'Happy',
        'Your Personal Wellness Companion': 'Your Personal Wellness Companion',
        'Diabetes (Sugar)': 'Diabetes (Sugar)',
        'Hypertension (BP)': 'Hypertension (BP)',
    };

    // Translate common strings when language changes
    useEffect(() => {
        if (language === 'en') {
            setTranslatedStrings(commonStrings);
            return;
        }

        const translateCommonStrings = async () => {
            setIsTranslating(true);
            const keys = Object.keys(commonStrings);
            const translations = await translateBatch(keys, language);

            const newStrings = {};
            keys.forEach((key, index) => {
                newStrings[key] = translations[index];
            });

            setTranslatedStrings(newStrings);
            setIsTranslating(false);
        };

        translateCommonStrings();
    }, [language]);

    // Translation function for components - uses hardcoded translations first
    const t = useCallback((text) => {
        if (language === 'en') return text;

        // Check hardcoded translations first (instant, no API needed)
        if (language === 'ta' && tamilTranslations[text]) {
            return tamilTranslations[text];
        }
        if (language === 'hi' && hindiTranslations[text]) {
            return hindiTranslations[text];
        }

        // Fallback to API-translated strings
        return translatedStrings[text] || text;
    }, [language, translatedStrings]);

    // Async translation for dynamic content
    const translateAsync = useCallback(async (text) => {
        if (language === 'en') return text;
        return await translateText(text, language);
    }, [language]);

    const value = {
        language,
        setLanguage,
        isTranslating,
        t,
        translateAsync,
        languages: LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook to use language context
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
