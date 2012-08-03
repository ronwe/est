exports.html_encode = function(str){
	return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
	//return str.replace(/&/, '&amp;').replace(/</g, '&lt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;'); 	
	} 

exports.url_encode = function(str){
	return encodeURIComponent(str);
	}

exports.cloneObj = function(obj){
	var ret = {};
	for(var keys = Object.keys(obj), l = keys.length; l; --l)
		ret[ keys[l-1] ] = obj[ keys[l-1] ];

	return ret;
	
	}	

exports.mSubstr = function(str , len , pad){
	if (!str || 0 == str.length) return '';
	if (undefined == pad ) pad = '...';
	return str.substr( 0 , len) + ((pad && str.length> len) ? pad : '');
	}

exports.nl2br = function(html){
	if(typeof html != 'string') {
		console.log(html , 'not a string');
		return  '';
	}
	return html.replace(/\n/g , '<br />');
	}

exports.getLink  =  function(obj , query){
	obj = obj || {};
	query = query || {};
	var url = [];
	delete query['frm'];
	for (var k in query){
		if(k in obj) continue;
		url.push( k + '=' + encodeURIComponent(query[k]));
		}

	for(var x in obj){
		if(obj[x] === null) continue;
		url.push( x + '=' + encodeURIComponent(obj[x]) );
		}	

	return '?' + url.join('&');
	}

	
