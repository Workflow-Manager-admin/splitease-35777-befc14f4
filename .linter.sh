#!/bin/bash
cd /home/kavia/workspace/code-generation/splitease-35777-befc14f4/splitease_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

