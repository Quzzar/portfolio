from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/fav.ico")
def favicon():
	return send_from_directory(os.path.join(app.root_path, 'static'),'fav.ico',mimetype='image/vnd.microsof.icon')

if __name__ == '__main__':
    app.run(debug=True)