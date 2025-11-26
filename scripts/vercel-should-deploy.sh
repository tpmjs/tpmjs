#!/bin/bash

# Vercel Deployment Guard
# This script checks if GitHub Actions CI has passed before allowing Vercel to deploy
# Configure this in Vercel Project Settings > Git > Ignored Build Step

set -e

echo "🔍 Checking if deployment should proceed..."

# Check if we're in a Vercel environment
if [ -z "$VERCEL" ]; then
  echo "❌ Not in Vercel environment"
  exit 1
fi

# Get the current commit SHA
COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA}"

if [ -z "$COMMIT_SHA" ]; then
  echo "⚠️  No commit SHA found, allowing deployment"
  exit 1
fi

echo "📝 Commit SHA: $COMMIT_SHA"

# For production deployments, check CI status
if [ "$VERCEL_ENV" = "production" ]; then
  echo "🏭 Production deployment detected"

  # Check if this is a PR or a direct push to main
  if [ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
    echo "🔀 Pull Request #$VERCEL_GIT_PULL_REQUEST_ID"
    echo "✅ Allowing deployment (PR deployments are previews)"
    exit 1
  fi

  # For direct pushes to main, only deploy if CI passed
  echo "🔒 Direct push to main - checking CI status..."

  # Check GitHub commit status using GitHub API
  if [ -n "$GITHUB_TOKEN" ]; then
    REPO_OWNER="${VERCEL_GIT_REPO_OWNER}"
    REPO_NAME="${VERCEL_GIT_REPO_SLUG}"

    echo "📡 Fetching CI status from GitHub..."
    STATUS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/commits/$COMMIT_SHA/status" \
      | jq -r '.state')

    echo "📊 CI Status: $STATUS"

    if [ "$STATUS" = "success" ]; then
      echo "✅ CI passed - proceeding with deployment"
      exit 1
    elif [ "$STATUS" = "pending" ]; then
      echo "⏳ CI is still running - skipping deployment"
      echo "💡 Vercel will automatically retry when CI completes"
      exit 0
    else
      echo "❌ CI failed or status unavailable - blocking deployment"
      exit 0
    fi
  else
    echo "⚠️  GITHUB_TOKEN not configured"
    echo "💡 Add GITHUB_TOKEN to Vercel environment variables"
    echo "⚠️  Allowing deployment anyway (configure token to enforce CI checks)"
    exit 1
  fi
else
  echo "🔍 Preview deployment - allowing deployment"
  exit 1
fi
