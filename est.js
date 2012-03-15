var path = require("path"); 
var fs = require('fs');
var md5 = require('crypto');
var _cacheArr = {};
var _watched = {};
var compiledFolder = '',
	watchingTpl = true;
var htmlend = '\\n';
var isWindows = process.platform === 'win32';
function watchTpl(tplname){
    //var dir = path.dirname(tplname);
    //if (_watched[dir] ) {return;}
    if (_watched[tplname] ) {return;}

    if (isWindows)
       fs.watch(tplname , { persistent: true , interval: 10 },onChg);
    else    
       fs.watchFile(tplname , { persistent: true , interval: 10 },onChg);
    
    function onChg(event , filename) {
         //var tplname = dir + '/' + filename;
        _cacheArr[tplname] && delete _cacheArr[tplname];

        }
    
    _watched[tplname] = true;
    //_watched[dir] = true;
    }
function getCompiledName(tplname,tplPre) {
    return compiledFolder + (tplPre||'')+ md5.createHash('md5').update(tplname).digest("hex") + '.est';
    }
function renderFile(tplpath , tplname , data , callBack , tplPre) {
    
    tplname = tplpath + tplname;

    var compiledFile = getCompiledName(  tplname , tplPre);
    //var compiledFile = tplname + '.est';
    if (watchingTpl) watchTpl(tplname);

    
    var fillTpl = function(){
           var html = require(compiledFile).html(data);
		   _cacheArr[tplname] = true;
           if ( callBack ) {
               callBack(null , html);
           }else {
               return html;
               }
        }
	
    if (path.existsSync(compiledFile) ){
		//console.log(tplname , _cacheArr[tplname]);
        if (_cacheArr[tplname]) {
            return fillTpl();
          }else{
            var tplMtime = fs.statSync(tplname).mtime;
            var compileMtime = fs.statSync(compiledFile).mtime;
			//console.log('tplMtime' + tplMtime);
            return tplMtime < compileMtime ? fillTpl() : compile(tplpath , tplname , compiledFile ,tplPre, fillTpl);
            }
     }else{
        return compile(tplpath ,tplname , compiledFile ,tplPre , fillTpl);
            
        }
    }

function compile(tplpath , tplname , compiledFile ,tplPre, callBack) {
    console.log('----------compile--', tplname);
    var dataName = '_data';
    function trsTpl(err,data){
        
        if (!data) return;
        var comFileCon = "var est = require(config.path.lib + 'est/est.js'); \nfunction __getHtml ("+ dataName +") { var __htm ='';\n";                                                                                                                                                
        var funcCon;
        var pos = 0 ,posStart = 0, posEnd = 0;
        var bufferLen = data.length;


        while (true){
             pos = findTag(data,pos,60 ,37);
            if (pos>-1) { posEnd = findTag(data,pos+2,37,62);}
            else {
                comFileCon += "__htm += '" + buffer2String(data, posStart ,bufferLen) + "';\n" ;
                break;
             }
            if ((pos>-1)  && posEnd){
                comFileCon += "__htm += '" + buffer2String(data, posStart ,pos) + "';\n" ;
                funcCon = data.toString('utf8',pos+2 ,posEnd).replace(/\bthis\./g , dataName + '.').replace(/\$_ENGINE_SELF\./g , 'est.');
                switch (funcCon[0]) {
                    case '*': break;
                    case '=':
                        comFileCon += '__htm +='+ funcCon.substr(1) + ";\n";
                        break;
                    case '#':
                        comFileCon += '__htm += est.renderFile("'+tplpath+'" ,"' + funcCon.substr(1).trim() + '",'+dataName+',null,"'+tplPre+'" );\n'; 
                        break;
                    case '!': 
                        funcCon = getHereDoc(funcCon.substr(1));
                    default:
                        comFileCon += funcCon;        
                    }

            }
            pos = posStart = posEnd+2;
            posEnd = 0;
        };

        comFileCon += "return __htm;} \n exports.html = __getHtml; ";
      // console.log(comFileCon);
        function onWriteDone(e){
                if (e){
                }else{

                    delete require.cache[compiledFile];
                    _cacheArr[tplname] = true; //compiledFile;

                    return callBack(); 
                    }
            };
		console.log(compiledFile);
        fs.writeFileSync(compiledFile  , comFileCon );
        return onWriteDone();
        };
        //fs.readFile(tplname , trsTpl);
        return trsTpl(null , fs.readFileSync(tplname)  );
    }
    
function getHereDoc(str){
   var herepos = str.indexOf('<<<');
   if (herepos < 0 ) return str; 
   var hereTag = str.substring(herepos + 3, str.indexOf(':',herepos)) + ':';
   var tmpv = str.split(hereTag);
   tmpv[0] = tmpv[0].substr(0 , herepos); 
   tmpv[1] = tmpv[1].trim().replace(/"/g,'\\"').replace(/[\r\n]+/g,htmlend ) ;

   str = tmpv.join('');
   return getHereDoc(str);
    
    }
function buffer2String(buffer,start , end){
        return  buffer.toString('utf8', start , end ).replace(/<script[^>]*>[\s\S\r\n]*<\/script>/m ,function(scriptStr){
            scriptStr = scriptStr.split("\n");
            if (scriptStr[0].indexOf('type="text/html"' )<0 ){ 
                var i=0,j=scriptStr.length;
                for(;i<j;i++){
                    if ('//' == scriptStr[i].trim().substr(0,2) ) scriptStr[i] = '';
                     }
                 }    
            return scriptStr.join('\n');
        }).replace(/\\/g,'\\\\').replace(/[\n\r]+/g,htmlend ).replace(/'/g,"\\'")  ;
        //return  buffer.toString('utf8', start , end ).replace(/\\/g,'\\\\').replace(/[\n\r]+/g,"\\\n").replace(/'/g,"\\'")  ;
    }
function findTag(buffer ,start , char1 , char2){
    for (var i= start , j= buffer.length; i <j;i++){
       // console.log(i+'|||'+buffer[i] +'||'+ buffer.toString('utf8' , i ,i+1));
        if (buffer[i] == char1 && buffer[i+1] == char2) {
                return i;
            }
        }
    return -1;
    }
var assigned = {}
exports.assignFn = function(fname , fncxt){
    assigned[fname] = fncxt;
    }
exports.callFn = function(fname){
    return assigned[fname] ;
    }
    
exports.renderFile = renderFile;
exports.setOption = function(options){
    compiledFolder = options.compiledFolder || '';
	if ( options.hasOwnProperty('watchingTpl') ) watchingTpl = options.watchingTpl;
	if ( options.hasOwnProperty('fuss') ) htmlend = options.fuss? '' : htmlend ;
}
