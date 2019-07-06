module.exports = {
	"extends": `${process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]}/.eslintrc.js`,
	"env": {
		"webextensions": true
	}
}