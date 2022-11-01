.PHONY: demo dist clean distclean

CSS = www/css/output.css

demo: www/matches.json www/matches
	mkdir -pv www/images/lvlshot
	@echo
	@echo =======================================================
	@echo Run ./devserve.sh now to launch the development server!

$(CSS):
	mkdir -pv $(@D)
	npx tailwindcss -i ./src/css/input.css -o $(CSS) --minify

dist: $(CSS)
	mkdir -pv dist
	#mkdir -pv dist/images/lvlshot
	mkdir -pv dist/images/
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

www/matches.json:
	mkdir -pv $(@D)
	cp -v demo_stats/matches.json $@

www/matches:
	mkdir -pv $(@D)
	cp -rv demo_stats/matches $(@D)

clean:
	rm -rf www/images/lvlshot
	rm -rf www/css
	rm -rf www/matches.json
	rm -rf www/matches
	rm -rf dist

distclean: clean
	rm -rf package.json
	rm -rf node_modules
	rm -rf package-lock.json
