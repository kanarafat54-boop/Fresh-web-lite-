# Fresh-web-lite-
A modern multiplatform content sharing site 
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "<h1>Welcome to my GitHub Cloud Site!</h1><p>This is running in a Codespace.</p>"

if __name__ == "__main__":
    # We use 0.0.0.0 so the cloud can access the local server
    app.run(host='0.0.0.0', port=