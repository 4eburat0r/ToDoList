# PowerShell start script: runs backend and frontend in separate consoles
$backend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd backend; go run main.go" -PassThru
$frontend = Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd frontend; npm start" -PassThru

Write-Host "Started backend (PID $($backend.Id)) and frontend (PID $($frontend.Id))." -ForegroundColor Green
