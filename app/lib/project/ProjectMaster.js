define([
    'metapolator/errors'
  , 'metapolator/models/MOM/Master'
  , 'metapolator/models/MOM/Glyph'
  , './MOMPointPen'
], function(
    errors
  , Master
  , Glyph
  , MOMPointPen
) {
    "use strict";

    function ProjectMaster(io, project, name, glyphSetDir, cpsFile) {
        this._io = io;
        this._project = project;
        this._name = name;
        this._glyphSetDir = glyphSetDir;
        this._cpsFile = cpsFile;
        this._glyphSet = undefined;
    }

    var _p = ProjectMaster.prototype;
    _p.constructor = ProjectMaster;

    Object.defineProperty(_p, 'glyphSet', {
        get: function() {
            if(!this._glyphSet)
                this._glyphSet = this._project.getNewGlyphSet(
                                            false, this._glyphSetDir);
            return this._glyphSet;
        }
    });

    _p.saveCPS = function(filename, cps) {
        this._io.writeFile(false, this._project.cpsDir+'/'+filename, cps);
    };

    _p.deleteCPS = function(filename) {
        this._io.unlink(false, this._project.cpsDir+'/'+filename);
    };

    _p.loadMOM = function() {
        // create a MOM Master use this.glyphSet to create glyphs, penstrokes and points
        var fontinfo = this._project.getFontinfo()
          , master = new Master(fontinfo)
          , glyphNames = this.glyphSet.keys()
          , glyphName
          , ufoGlyph
          , glyph
          , i=0
          , classes
          ;
        if(glyphNames.length)
            classes = this._project.getGlyphClassesReverseLookup();
        for(;i<glyphNames.length;i++) {
            glyphName = glyphNames[i];
            ufoGlyph = this.glyphSet.get(glyphName);
            glyph = new Glyph();// FIXME do the stuff of setUFOData here!
            glyph.id = glyphName;
            if(glyphName in classes)
                classes[glyphName].forEach(glyph.setClass, glyph);
            // fetch glyph data and draw the glyph to the MOM
            ufoGlyph.drawPoints(false, new MOMPointPen(glyph));
            // FIXME: if possible remove all usages of `setUFOData`.
            // This can happen in the Constructor.
            // maybe, when event propagation for this stuf is built, we
            // can use this method again
            glyph.setUFOData(ufoGlyph);
            master.add(glyph);
        }
        return master;
    };

    return ProjectMaster;
});
