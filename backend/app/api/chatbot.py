from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
from app.utils.translations import detect_language, get_contextual_prompt, translate

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: str
    language: Optional[str] = None  # Auto-detect if not provided
    map_context: Optional[dict] = None  # Current map state for context

class ChatResponse(BaseModel):
    reply: str
    context: str
    detected_language: Optional[str] = None

class ContextualSuggestion(BaseModel):
    suggestion: str
    action: str
    priority: str  # 'critical', 'high', 'medium', 'low'
    icon: str

class SuggestionsRequest(BaseModel):
    zones_count: int
    critical_zones_count: int
    available_resources: int
    total_resources: int
    language: str = 'en'

class SuggestionsResponse(BaseModel):
    suggestions: List[ContextualSuggestion]

class QuickCommandRequest(BaseModel):
    command: str
    args: List[str] = []
    language: str = 'en'

class QuickCommandResponse(BaseModel):
    success: bool
    message: str
    action: Optional[str] = None

# Initialize Groq AI globally
try:
    if settings.groq_api_key:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        model_name = "llama-3.3-70b-versatile"
    else:
        client = None
        model_name = None
except Exception as e:
    print(f"Groq AI Init Error: {e}")
    client = None
    model_name = None

@router.post("/message", response_model=ChatResponse)
def chatbot_reply(request: ChatRequest):
    """
    AI-powered chatbot using Groq AI with multi-language support.
    Falls back to rule-based responses if API fails.
    """
    print(f"Chatbot request received: {request.message}")
    print(f"Groq client initialized: {client is not None}")
    
    # Detect language if not provided
    detected_lang = request.language or detect_language(request.message)
    print(f"Detected language: {detected_lang}")
    
    try:
        if not client:
            print("Groq client not initialized, using fallback")
            raise Exception("Groq AI not initialized")

        print(f"Calling Groq API with model: {model_name}")
        
        # Build context-aware system prompt
        system_prompt = get_contextual_prompt(detected_lang)
        
        # Add map context if provided
        if request.map_context:
            context_info = f"\nCurrent situation: {request.map_context.get('zones_count', 0)} active zones, "
            context_info += f"{request.map_context.get('critical_zones', 0)} critical, "
            context_info += f"{request.map_context.get('available_resources', 0)}/{request.map_context.get('total_resources', 0)} resources available."
            system_prompt += context_info
        
        # Create chat completion with Groq (with timeout)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ],
            model=model_name,
            temperature=0.7,
            max_tokens=500,
            timeout=30.0  # 30 second timeout
        )
        
        reply = chat_completion.choices[0].message.content
        print(f"Groq API response received: {reply[:50]}...")
        return ChatResponse(reply=reply, context="Groq AI", detected_language=detected_lang)
        
    except Exception as e:
        print(f"Groq AI Error (Falling back to rules): {e}")
        
        # Fallback to rule-based responses
        msg = request.message.lower()
        
        if "evacuate" in msg or "safe" in msg:
            reply = "If you are in a red zone, evacuate immediately to the nearest shelter. Check the dashboard for shelter locations."
        elif "flood" in msg:
            reply = "For floods: Move to higher ground. Disconnect electrical appliances. Do not walk through moving water. Call 112 for emergency."
        elif "earthquake" in msg:
            reply = "Drop, Cover, and Hold On. Stay away from windows and exterior walls. After shaking stops, evacuate if building is damaged."
        elif "cyclone" in msg or "storm" in msg:
            reply = "Stay indoors away from windows. Stock emergency supplies. Listen to local authorities. Evacuate if ordered."
        elif "help" in msg or "emergency" in msg:
            reply = "Emergency services have been notified for high-risk areas. Please call 112 (National Emergency) or contact NDRF at 011-26105763 if you are in immediate danger."
        elif any(x in msg for x in ["hello", "hi", "hey", "greetings"]):
            reply = "Hello! I am AetherX, your AI disaster management assistant. Ask me about floods, earthquakes, cyclones, or emergency procedures."
        else:
            reply = "I'm here to help with disaster management queries. Ask me about safety procedures, evacuation routes, or emergency contacts."
            
        return ChatResponse(reply=reply, context="Fallback Rules", detected_language=detected_lang)

@router.post("/suggestions", response_model=SuggestionsResponse)
def get_contextual_suggestions(request: SuggestionsRequest):
    """
    Generate contextual AI suggestions based on current disaster state
    """
    suggestions = []
    
    # Critical zone allocation suggestion
    if request.critical_zones_count > 0 and request.available_resources > 0:
        suggestions.append(ContextualSuggestion(
            suggestion=translate('cmd_allocate_critical', request.language),
            action="allocate_critical",
            priority="critical",
            icon="🚨"
        ))
    
    # Low resource warning
    if request.available_resources < request.total_resources * 0.3:
        suggestions.append(ContextualSuggestion(
            suggestion="Request reinforcements - Low resource availability" if request.language == 'en' else translate('resources_available', request.language),
            action="request_reinforcements",
            priority="high",
            icon="📞"
        ))
    
    # Multiple zones suggestion
    if request.zones_count > 5:
        suggestions.append(ContextualSuggestion(
            suggestion="Multiple active zones detected - Prioritize by severity" if request.language == 'en' else translate('zones_active', request.language),
            action="view_status",
            priority="medium",
            icon="📊"
        ))
    
    # All clear suggestion
    if request.critical_zones_count == 0 and request.zones_count < 3:
        suggestions.append(ContextualSuggestion(
            suggestion="Situation stable - Monitor for new alerts" if request.language == 'en' else "स्थिति स्थिर है",
            action="monitor",
            priority="low",
            icon="✅"
        ))
    
    return SuggestionsResponse(suggestions=suggestions)

@router.post("/command", response_model=QuickCommandResponse)
def process_quick_command(request: QuickCommandRequest):
    """
    Process quick commands from the chatbot
    """
    cmd = request.command.lower()
    
    # Status command
    if cmd in ['/status', '/s']:
        return QuickCommandResponse(
            success=True,
            message=translate('cmd_status', request.language),
            action="show_status"
        )
    
    # Allocate critical command
    if cmd in ['/allocate-critical', '/ac', '/critical']:
        return QuickCommandResponse(
            success=True,
            message=translate('cmd_allocate_critical', request.language),
            action="allocate_critical"
        )
    
    # Help command
    if cmd in ['/help', '/h', '/?']:
        return QuickCommandResponse(
            success=True,
            message=translate('cmd_help', request.language),
            action="show_help"
        )
    
    # Clear selection
    if cmd in ['/clear-selection', '/clear', '/cs']:
        return QuickCommandResponse(
            success=True,
            message="Selection cleared" if request.language == 'en' else "चयन साफ़ किया गया",
            action="clear_selection"
        )
    
    # Toggle safe areas
    if cmd in ['/toggle-safe-areas', '/safe', '/tsa']:
        return QuickCommandResponse(
            success=True,
            message="Toggling safe areas" if request.language == 'en' else "सुरक्षित क्षेत्र टॉगल करें",
            action="toggle_safe_areas"
        )
    
    # Unknown command
    return QuickCommandResponse(
        success=False,
        message=f"Unknown command: {cmd}. Type /help for available commands."
    )
