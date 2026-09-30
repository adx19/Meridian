import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from sqlalchemy.exc import IntegrityError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.db.base  # noqa: F401
from app.services.intelligence_service import get_or_generate_repository_intelligence


AI_RESULT = {
    "summary": "summary",
    "development_update": "recent work",
    "project_insights": {
        "current_focus": "focus",
        "completed_milestones": [],
        "potential_risks": [],
    },
    "next_priorities": [],
    "main_technologies": [],
}


def locked_repository_query(repository):
    query = MagicMock()
    query.filter.return_value.with_for_update.return_value.one.return_value = repository
    return query


def intelligence_query(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    return query


class IntelligenceServiceTests(unittest.TestCase):
    def test_returns_existing_intelligence_without_generating(self):
        repository = SimpleNamespace(id=1, name="demo")
        existing = SimpleNamespace(id=10, repository_id=1)
        db = MagicMock()
        db.query.side_effect = [
            locked_repository_query(repository),
            intelligence_query(existing),
        ]

        with patch("app.services.intelligence_service.generate_repository_intelligence") as mock_generate:
            result = get_or_generate_repository_intelligence(repository, [], db)

        self.assertIs(result, existing)
        mock_generate.assert_not_called()
        db.add.assert_not_called()
        db.commit.assert_not_called()

    @patch("app.services.intelligence_service.generate_repository_intelligence", return_value=AI_RESULT)
    def test_generates_and_persists_new_intelligence(self, mock_generate):
        repository = SimpleNamespace(id=2, name="demo", description="A sample repo", language="Python")
        db = MagicMock()
        db.query.side_effect = [
            locked_repository_query(repository),
            intelligence_query(None),
        ]

        result = get_or_generate_repository_intelligence(repository, [], db)

        self.assertEqual(result.repository_id, repository.id)
        self.assertEqual(result.summary, "summary")
        mock_generate.assert_called_once()
        self.assertEqual(mock_generate.call_args.args[:2], (repository, []))
        db.add.assert_called_once()
        db.commit.assert_called_once()

    @patch("app.services.intelligence_service.generate_repository_intelligence", return_value=AI_RESULT)
    def test_returns_cached_record_after_concurrent_insert(self, mock_generate):
        repository = SimpleNamespace(id=3, name="demo")
        cached = SimpleNamespace(id=11, repository_id=3)
        db = MagicMock()
        db.query.side_effect = [
            locked_repository_query(repository),
            intelligence_query(None),
            intelligence_query(cached),
        ]
        db.commit.side_effect = IntegrityError("INSERT", {}, Exception("duplicate key"))

        result = get_or_generate_repository_intelligence(repository, [], db)

        self.assertIs(result, cached)
        mock_generate.assert_called_once()
        self.assertEqual(mock_generate.call_args.args[:2], (repository, []))
        db.rollback.assert_called_once()

    @patch("app.services.intelligence_service.generate_repository_intelligence")
    def test_rolls_back_when_generation_fails(self, mock_generate):
        repository = SimpleNamespace(id=4, name="demo")
        mock_generate.side_effect = RuntimeError("Gemini unavailable")
        db = MagicMock()
        db.query.side_effect = [
            locked_repository_query(repository),
            intelligence_query(None),
        ]

        with self.assertRaises(RuntimeError) as context:
            get_or_generate_repository_intelligence(repository, [], db)

        self.assertIn("Gemini unavailable", str(context.exception))
        db.rollback.assert_called_once()
        db.commit.assert_not_called()

if __name__ == "__main__":
    unittest.main()
