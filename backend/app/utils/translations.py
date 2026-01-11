# Translation utilities for multi-language support
from typing import Dict, Optional
import re

# Supported languages
SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'bn']  # English, Hindi, Tamil, Bengali

# Common phrase translations
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    # System messages
    'allocation_success': {
        'en': 'Resources allocated successfully',
        'hi': 'संसाधन सफलतापूर्वक आवंटित किए गए',
        'ta': 'வளங்கள் வெற்றிகரமாக ஒதுக்கப்பட்டன',
        'bn': 'সম্পদ সফলভাবে বরাদ্দ করা হয়েছে'
    },
    'dispatch_success': {
        'en': 'Resources dispatched successfully',
        'hi': 'संसाधन सफलतापूर्वक भेजे गए',
        'ta': 'வளங்கள் வெற்றிகரமாக அனுப்பப்பட்டன',
        'bn': 'সম্পদ সফলভাবে প্রেরণ করা হয়েছে'
    },
    'critical_alert': {
        'en': 'Critical disaster detected',
        'hi': 'गंभीर आपदा का पता चला',
        'ta': 'முக்கியமான பேரிடர் கண்டறியப்பட்டது',
        'bn': 'গুরুতর দুর্যোগ সনাক্ত করা হয়েছে'
    },
    'resources_available': {
        'en': 'resources available',
        'hi': 'संसाधन उपलब्ध',
        'ta': 'வளங்கள் கிடைக்கின்றன',
        'bn': 'সম্পদ উপলব্ধ'
    },
    'zones_active': {
        'en': 'active zones',
        'hi': 'सक्रिय क्षेत्र',
        'ta': 'செயலில் உள்ள மண்டலங்கள்',
        'bn': 'সক্রিয় অঞ্চল'
    },
    # Quick commands
    'cmd_allocate_critical': {
        'en': 'Allocate to critical zones',
        'hi': 'गंभीर क्षेत्रों को आवंटित करें',
        'ta': 'முக்கியமான மண்டலங்களுக்கு ஒதுக்கவும்',
        'bn': 'গুরুত্বপূর্ণ অঞ্চলে বরাদ্দ করুন'
    },
    'cmd_status': {
        'en': 'Show system status',
        'hi': 'सिस्टम स्थिति दिखाएं',
        'ta': 'அமைப்பு நிலையைக் காட்டு',
        'bn': 'সিস্টেম স্থিতি দেখান'
    },
    'cmd_help': {
        'en': 'Show available commands',
        'hi': 'उपलब्ध कमांड दिखाएं',
        'ta': 'கிடைக்கும் கட்டளைகளைக் காட்டு',
        'bn': 'উপলব্ধ কমান্ড দেখান'
    },
    # Disaster types
    'flood': {
        'en': 'Flood',
        'hi': 'बाढ़',
        'ta': 'வெள்ளம்',
        'bn': 'বন্যা'
    },
    'earthquake': {
        'en': 'Earthquake',
        'hi': 'भूकंप',
        'ta': 'நிலநடுக்கம்',
        'bn': 'ভূমিকম্প'
    },
    'wildfire': {
        'en': 'Wildfire',
        'hi': 'जंगल की आग',
        'ta': 'காட்டுத் தீ',
        'bn': 'দাবানল'
    },
    'cyclone': {
        'en': 'Cyclone',
        'hi': 'चक्रवात',
        'ta': 'சூறாவளி',
        'bn': 'ঘূর্ণিঝড়'
    },
    # Resource types
    'ambulance': {
        'en': 'Ambulance',
        'hi': 'एम्बुलेंस',
        'ta': 'ஆம்புலன்ஸ்',
        'bn': 'অ্যাম্বুলেন্স'
    },
    'helicopter': {
        'en': 'Helicopter',
        'hi': 'हेलीकॉप्टर',
        'ta': 'ஹெலிகாப்டர்',
        'bn': 'হেলিকপ্টার'
    },
    'fire_truck': {
        'en': 'Fire Truck',
        'hi': 'अग्निशमन वाहन',
        'ta': 'தீயணைப்பு வாகனம்',
        'bn': 'ফায়ার ট্রাক'
    },
    'police': {
        'en': 'Police',
        'hi': 'पुलिस',
        'ta': 'காவல்துறை',
        'bn': 'পুলিশ'
    },
    'ndrf_team': {
        'en': 'NDRF Team',
        'hi': 'एनडीआरएफ टीम',
        'ta': 'NDRF குழு',
        'bn': 'NDRF দল'
    }
}

def detect_language(text: str) -> str:
    """
    Detect language from text using character ranges
    Returns language code: 'en', 'hi', 'ta', 'bn'
    """
    if not text:
        return 'en'
    
    # Hindi (Devanagari): U+0900 to U+097F
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi'
    
    # Tamil: U+0B80 to U+0BFF
    if re.search(r'[\u0B80-\u0BFF]', text):
        return 'ta'
    
    # Bengali: U+0980 to U+09FF
    if re.search(r'[\u0980-\u09FF]', text):
        return 'bn'
    
    # Default to English
    return 'en'

def translate(key: str, target_lang: str = 'en') -> str:
    """
    Translate a key to target language
    Falls back to English if translation not found
    """
    if target_lang not in SUPPORTED_LANGUAGES:
        target_lang = 'en'
    
    if key not in TRANSLATIONS:
        return key
    
    return TRANSLATIONS[key].get(target_lang, TRANSLATIONS[key].get('en', key))

def translate_text(text: str, target_lang: str = 'en') -> str:
    """
    Translate text by looking for known phrases
    For complex translations, this should use an AI model
    """
    # Normalize key
    key = text.lower().replace(' ', '_')
    
    # Try direct translation
    if key in TRANSLATIONS:
        return translate(key, target_lang)
    
    # Return original if no translation found
    return text

def get_language_name(lang_code: str) -> str:
    """Get full language name from code"""
    names = {
        'en': 'English',
        'hi': 'हिन्दी (Hindi)',
        'ta': 'தமிழ் (Tamil)',
        'bn': 'বাংলা (Bengali)'
    }
    return names.get(lang_code, 'English')

def get_contextual_prompt(lang_code: str) -> str:
    """
    Get system prompt for AI in target language
    """
    prompts = {
        'en': "You are a disaster management AI assistant. Provide concise, actionable advice for emergency operations.",
        'hi': "आप एक आपदा प्रबंधन AI सहायक हैं। आपातकालीन संचालन के लिए संक्षिप्त, कार्रवाई योग्य सलाह प्रदान करें।",
        'ta': "நீங்கள் ஒரு பேரிடர் மேலாண்மை AI உதவியாளர். அவசர நடவடிக்கைகளுக்கு சுருக்கமான, செயல்படக்கூடிய ஆலோசனை வழங்கவும்.",
        'bn': "আপনি একটি দুর্যোগ ব্যবস্থাপনা AI সহায়ক। জরুরি অপারেশনের জন্য সংক্ষিপ্ত, কার্যকর পরামর্শ প্রদান করুন।"
    }
    return prompts.get(lang_code, prompts['en'])
