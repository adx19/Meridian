import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.ai_providers.gemini_provider import generate_with_gemini


class GeminiProviderTests(unittest.TestCase):
    def test_generate_with_gemini_requires_api_key(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}, clear=False):
            with self.assertRaises(RuntimeError) as context:
                generate_with_gemini("hello")
            self.assertIn("GEMINI_API_KEY", str(context.exception))


if __name__ == "__main__":
    unittest.main()
