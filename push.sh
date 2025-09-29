#!/bin/sh

# Push script for xylar-99 branch
# This script adds, commits, and pushes changes to the current branch

BRANCH_NAME="xylar-99"
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on the correct branch
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo "Warning: You are on branch '$CURRENT_BRANCH', not '$BRANCH_NAME'"
    echo "Do you want to continue with '$CURRENT_BRANCH'? (y/N)"
    read -r response
    if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "Operation cancelled."
        exit 1
    fi
    BRANCH_NAME=$CURRENT_BRANCH
fi

# Check if there are any changes to add
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit. Working directory is clean."
    exit 0
fi

echo "Changes to be added and committed:"
git status --short

# Add all changes
echo "Adding all changes..."
git add .

if [ $? -ne 0 ]; then
    echo "❌ Failed to add changes"
    exit 1
fi

# Get commit message
echo "Enter commit message (or press Enter for default message):"
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Commit changes
echo "Committing changes with message: '$commit_message'"
git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "❌ Failed to commit changes"
    exit 1
fi

echo "Pushing branch '$BRANCH_NAME' to origin..."

# Push the current branch to origin
git push origin "$BRANCH_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Successfully added, committed, and pushed to branch '$BRANCH_NAME'!"
else
    echo "❌ Failed to push branch '$BRANCH_NAME'"
    exit 1
fi
