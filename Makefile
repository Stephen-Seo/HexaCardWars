THREEJS_ZIP_NAME=threejs_bd885e92f3fe8f71fc1160492e9a81ea9d8d94fe.zip

JAVASCRIPT_SOURCES = \
	src/game.js

JAVASCRIPT_SOURCES_OUT = $(subst src,dist,${JAVASCRIPT_SOURCES})

all: dist/index.html dist/threejs ${JAVASCRIPT_SOURCES_OUT}

dist/index.html: index.html
	@mkdir -p dist
	cp index.html dist/index.html

dist/%.js: src/%.js
	@mkdir -p $(dir $<)
	cp $< $@

dist/threejs: third_party/${THREEJS_ZIP_NAME}
	@mkdir -p dist/threejs
	(test -x /bin/bsdtar && bsdtar -xf third_party/${THREEJS_ZIP_NAME} -C dist/threejs) \
		|| (text -x /bin/unzip && unzip -d dist/threejs third_party/${THREEJS_ZIP_NAME})

.PHONY: clean

clean:
	rm -rf dist
