THREEJS_ZIPS = \
	third_party/threejs_bd885e92f3fe8f71fc1160492e9a81ea9d8d94fe.zip \
	third_party/threejs_addons_loaders_bd885e92f3fe8f71fc1160492e9a81ea9d8d94fe.zip \
	third_party/threejs_addons_utils_bd885e92f3fe8f71fc1160492e9a81ea9d8d94fe.zip \
	third_party/threejs_addons_misc_bd885e92f3fe8f71fc1160492e9a81ea9d8d94fe.zip

JAVASCRIPT_SOURCES = \
	src/game.js \
	src/hex.js \
	src/utils.js \
	src/constants.js

JAVASCRIPT_SOURCES_OUT = $(subst src,dist,${JAVASCRIPT_SOURCES})

all: dist/index.html dist/threejs ${JAVASCRIPT_SOURCES_OUT} res

dist/index.html: index.html
	@mkdir -p dist
	cp index.html dist/index.html

dist/%.js: src/%.js
	@mkdir -p $(dir $<)
	cp $< $@

dist/threejs: ${THREEJS_ZIPS}
	@mkdir -p dist/threejs
	echo -n "${THREEJS_ZIPS}" | xargs -d ' ' -I zipname bash -c \
		'(test -x /bin/bsdtar && bsdtar -xf zipname -C dist/threejs) \
		|| (text -x /bin/unzip && unzip -d dist/threejs zipname)'
	find dist/threejs/addons -type f -regex '.*\.js$$' -exec sed -i 's|"three"|"/threejs/Three.js"|g' '{}' ';'

.PHONY: clean res

res:
	@mkdir -p dist
	cp -r res dist/

clean:
	rm -rf dist
