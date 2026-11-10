#!/usr/bin/env bash
# ==============================================================================
# Professional Git & GitHub synchronization tool for Drafter
# ==============================================================================

set -e

# Styling
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BRANCH="${1:-$(git branch --show-current || echo 'main')}"

echo -e "\n${CYAN}==> Syncing Drafter repository with branch: ${BRANCH}${NC}"

# Check for Git root
if [ ! -d ".git" ]; then
    echo -e "${RED}[ERROR] Current directory is not a Git repository root.${NC}"
    exit 1
fi

# Pre-flight check: Remote check
if ! git remote | grep -q 'origin'; then
    echo -e "${YELLOW}[WARN] No remote 'origin' configured.${NC}"
    echo -e "Add your GitHub repository:"
    echo -e "  git remote add origin https://github.com/<your-user>/<repo>.git"
    echo -e "  git push -u origin ${BRANCH}"
    exit 0
fi

# Fetch and Rebase
echo -e "${CYAN}==> Fetching origin...${NC}"
git fetch origin

echo -e "${CYAN}==> Rebasing onto origin/${BRANCH}...${NC}"
git pull --rebase origin "${BRANCH}"

# Push commits
echo -e "${CYAN}==> Pushing to origin/${BRANCH}...${NC}"
git push origin "${BRANCH}"

echo -e "${GREEN}[OK] GitHub sync complete!${NC}\n"
