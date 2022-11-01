.PHONY: devserve init css css_watch dist clean

devserve: init
	./devserve.sh

css: init
	npx tailwindcss -i ./src/css/input.css -o ./build/css/output.css --minify

dist: css
	mkdir -v dist
	mkdir -pv dist/images/lvlshot
	mkdir -pv dist/css
	mkdir -pv dist/matches
	cp -v build/css/output.css dist/css/
	cp -rv www/awards_map.json \
		www/gametypes_map.json \
		www/items_map.json \
		www/index.html \
		www/js/ \
		www/templates/ \
		www/contrib/ \
		dist/
	cp -rv www/images/icons/ \
		www/images/medals/ \
		www/images/ratmod-head-icon.svg \
		dist/images/

init: build build/css build/images/lvlshot

build:
	mkdir -v build

build/css:
	mkdir -pv build/css

build/images/lvlshot:
	mkdir -pv build/images/lvlshot

clean:
	rm -rf dist
	rm -rf build
