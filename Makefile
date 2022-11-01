.PHONY: demo dist clean distclean

CSS = build/css/output.css

demo: build/index.json build/matches
	mkdir -pv build/images/lvlshot
	@echo
	@echo =======================================================
	@echo Run ./devserve.sh now to launch the development server!

$(CSS):
	mkdir -pv $(@D)
	npx tailwindcss -i ./src/css/input.css -o $(CSS) --minify

dist: $(CSS)
	mkdir -pv dist
	mkdir -pv dist/images/lvlshot
	mkdir -pv dist/css
	cp -v $(CSS) dist/css/
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

build/index.json:
	mkdir -pv $(@D)
	ln -s ../demo_stats/index.json $@

build/matches:
	mkdir -pv $(@D)
	ln -s ../demo_stats/matches $@

clean:
	rm -rf dist
	rm -rf build

distclean: clean
	rm -rf package.json
	rm -rf node_modules
	rm -rf package-lock.json
