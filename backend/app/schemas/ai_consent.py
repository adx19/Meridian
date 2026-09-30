from pydantic import BaseModel

class AIConsentRequest(BaseModel):
  user_id: int
  ai_consent: bool
  ai_enabled: bool