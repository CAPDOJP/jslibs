/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-referer"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
var div=$('<div>').css({
	'box-sizing':'border-box',
	'margin':'0px',
	'padding':'0px',
	'position':'relative',
	'vertical-align':'top'
});
var span=$('<span>').css({
	'box-sizing':'border-box',
	'color':'#3498db',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px 5px',
	'vertical-align':'top'
});
var button=$('<button>').css({
	'background-color':'transparent',
	'border':'none',
	'box-sizing':'border-box',
	'color':'#3498db',
	'cursor':'pointer',
	'font-size':'13px',
	'height':'30px',
	'line-height':'30px',
	'margin':'0px 3px',
	'outline':'none',
	'padding':'0px 1em',
	'vertical-align':'top',
	'width':'auto'
});
var cell=$('<td>').css({
	'border':'1px solid #3498db',
	'cursor':'pointer'
});
var checkbox=$('<label>').css({
	'box-sizing':'border-box',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px',
	'vertical-align':'top'
})
.append($('<input type="checkbox" class="receiver">'))
.append(span.clone(true).addClass('label').css({'padding':'0px 10px 0px 5px'}));
var radio=$('<label>').css({
	'box-sizing':'border-box',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px',
	'vertical-align':'top'
})
.append($('<input type="radio" class="receiver">'))
.append(span.clone(true).addClass('label').css({'padding':'0px 10px 0px 5px'}));
var referer=div.clone(true).css({
	'display':'inline-block',
	'line-height':'30px',
	'width':'100%'
})
.append(
	span.clone(true).addClass('label').css({
		'overflow':'hidden',
		'padding-left':'35px',
		'text-overflow':'ellipsis',
		'white-space':'nowrap',
		'width':'100%'
	})
)
.append($('<input type="hidden" class="receiver">'))
.append($('<input type="hidden" class="key">'))
.append($('<input type="hidden" class="picker">'))
.append(
	button.clone(true).addClass('button').css({
		'left':'0px',
		'margin':'0px',
		'padding':'0px',
		'position':'absolute',
		'top':'0px',
		'width':'30px'
	})
	.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/search.png">').css({'width':'100%'}))
);
var select=$('<select>').css({
	'border':'1px solid #3498db',
	'border-radius':'3px',
	'box-sizing':'border-box',
	'color':'#3498db',
	'display':'inline-block',
	'height':'30px',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px 5px',
	'vertical-align':'top',
	'width':'auto'
});
var textarea=$('<textarea>').css({
	'border':'1px solid #3498db',
	'border-radius':'3px',
	'box-sizing':'border-box',
	'display':'block',
	'height':'calc(7.5em + 10px)',
	'line-height':'1.5em',
	'padding':'5px',
	'vertical-align':'top',
	'width':'100%'
});
var textline=$('<input type="text">').css({
	'border':'1px solid #3498db',
	'border-radius':'3px',
	'box-sizing':'border-box',
	'display':'inline-block',
	'height':'30px',
	'line-height':'30px',
	'padding':'0px 5px',
	'vertical-align':'top',
	'width':'100%'
});
var time=div.clone(true).css({
	'display':'inline-block',
	'line-height':'30px'
})
.append(select.clone(true).addClass('receiverhour'))
.append(span.clone(true).text('：'))
.append(select.clone(true).addClass('receiverminute'));
for (var i=0;i<24;i++) $('.receiverhour',time).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
for (var i=0;i<60;i++) $('.receiverminute',time).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
var title=$('<label class="title">').css({
	'box-sizing':'border-box',
	'border-left':'5px solid #3498db',
	'display':'block',
	'line-height':'25px',
	'margin':'5px 0px',
	'padding':'0px',
	'padding-left':'5px'
});
var createdialog=function(height,width){
	return {
		cover:div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		}),
		container:div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'height':height+'px',
			'left':'0',
			'margin':'auto',
			'max-height':'calc(100% - 1em)',
			'max-width':'calc(100% - 1em)',
			'padding':'5px 5px 40px 5px',
			'position':'absolute',
			'right':'0',
			'top':'0',
			'width':width+'px'
		}),
		contents:div.clone(true).css({
			'height':'100%',
			'margin':'0px',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'padding':'5px 5px 10px 5px',
			'position':'relative',
			'text-align':'left',
			'width':'100%',
			'z-index':'1'
		}),
		header:div.clone(true).css({
			'border-bottom':'1px solid #3498db',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'left',
			'top':'0px',
			'width':'100%',
			'z-index':'3'
		}),
		footer:div.clone(true).css({
			'border-top':'1px solid #3498db',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'3'
		}),
		lists:$('<table>').css({
			'box-sizing':'border-box',
			'width':'100%'
		}).append($('<tbody>'))
	};
}
/*
*--------------------------------------------------------------------
* Referer
*--------------------------------------------------------------------
* parameters
* options	@ datasource		:json
*			@ displaytext		:display text (array)
*			@ searches			:search condition elements
*								.id is elements id
*								.label is elements label text
*								.type is elements type [select,input,multi] (multi is all fields search)
*								.param is api parameter (<select> only)
*								.value is key for value (<select> only)
*								.text is key for display text (<select> only)
*							.callback is value change event
*							-example-
*							searches[
*								{
*									id:'users',
*									label:'choose user',
*									type:'select',
*									param:{app:1},
*									value:'userid,
*									text:'username',
*									callback:function(elements){...}
*								},
*								{
*									id:'companyname',
*									label:'input companyname',
*									type:'input',
*									callback:function(elements){...}
*								}
*							]
* -------------------------------------------------------------------
*/
var Referer=function(options){
	var options=$.extend({
		container:null,
		datasource:null,
		displaytext:[],
		searches:[]
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.datasource=(options.datasource!=null)?options.datasource:[];
	this.displaytext=options.displaytext;
	this.searches=options.searches;
	this.dialog=createdialog(700,900);
	this.searchblock=this.dialog.header
	this.callback=null;
	/* append elements */
	$.each(this.searches,function(index){
		var searchvalue=$.extend({
			id:'',
			label:'',
			type:'',
			param:{},
			value:'',
			text:'',
			callback:null
		},my.searches[index]);
		var searchfield=null;
		switch (searchvalue.type)
		{
			case 'select':
				searchfield=select.clone(true).attr('id',searchvalue.id);
				searchfield.listitems({
					param:searchvalue.param,
					value:searchvalue.value,
					text:searchvalue.text,
					addition:$('<option value="">'+((searchvalue.label)?searchvalue.label:'')+'</option')
				});
				$.data(searchfield[0],'multi',false);
				my.dialog.header.append(searchfield.css({'width':'100%'}));
				break;
			case 'input':
			case 'multi':
				searchfield=textline.clone(true).attr('id',searchvalue.id);
				if (searchvalue.label) searchfield.attr('placeholder',searchvalue.label);
				$.data(searchfield[0],'multi',(searchvalue.type=='multi'));
				my.dialog.header.append(searchfield.css({'margin-right':'-30px','padding-right':'35px'}));
				my.dialog.header.append(
					$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/search.png" class="add" alt="絞り込み" title="絞り込み">')
					.css({
						'cursor':'pointer',
						'vertical-align':'top',
						'width':'30px'
					})
					.on('click',function(){
						/* reload referer */
						my.search();
					})
				);
				break;
		}
		if (searchvalue.callback!=null) searchfield.on('change',function(){searchvalue.callback(searchfield);});
	});
	if (this.searches.length!=0)
	{
		$('input[type=text],select',this.dialog.header).on('keydown',function(e){
			var code=e.keyCode||e.which;
			if (code==13)
			{
				var targets=my.dialog.container.find('button,input[type=text],select,table');
				var total=targets.length;
				var index=targets.index(this);
				if (e.shiftKey)
				{
					if (index==0) index=total;
					index--;
				}
				else
				{
					index++;
					if (index==total) index=0;
				}
				targets.eq(index).focus();
				return false;
			}
		});
	}
	this.dialog.contents.append(this.dialog.lists);
	this.dialog.container.append(this.dialog.contents);
	if (this.searches.length!=0)
	{
		this.dialog.contents.css({'padding-top':'10px'})
		this.dialog.container.append(this.dialog.header);
	}
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container.css({'padding-top':((this.searches.length!=0)?'40px':'5px')}));
	options.container.append(this.dialog.cover);
	/* create template */
	this.template=$('<tr>')
	.on('mouseover',function(e){$(this).css({'background-color':'#f5b2b2'});})
	.on('mouseout',function(e){$(this).css({'background-color':'transparent'});});
	$.each(my.displaytext,function(index){
		my.template
		.append(cell.clone(true).css({'padding':'5px'}))
		.on('click',function(){if (my.callback!=null) my.callback($(this));});
	});
	/* reload referer */
	this.search();
};
Referer.prototype={
	/* reload referer */
	search:function(){
		var my=this;
		var lists=this.dialog.lists.find('tbody').find('tr').find('td');
		var filtersearch=this.datasource;
		if (this.searches.length!=0)
		{
			var searches=this.dialog.header.find('input[type=text],select');
			filtersearch=$.grep(this.datasource,function(item,index){
				var exists=0;
				$.each(searches,function(index){
					var searchesvalue=($(this).val())?$(this).val():'';
					if (searchesvalue=='') exists++;
					else
					{
						var checker=0;
						if ($.data($(this)[0],'multi'))
						{
							var pattern=searchesvalue.replace(/[ 　]+/g,' ');
							var patterns=pattern.split(' ');
							pattern='';
							$.each(patterns,function(index){
							    pattern+='(?=.*'+patterns[index]+')';
							});
							$.each(item,function(key,values){
							    if (values.value) checker+=(values.value.toString().match(new RegExp('(^'+pattern+')+','ig'))!=null)?1:0;
							});
						}
						else checker+=(item[$(this).attr('id')].value==searchesvalue)?1:0;
						exists+=(checker!=0)?1:0;
					}
				});
				return searches.length==exists;
			});
		}
		/* lists callback */
		$.each(lists,function(index){
			$(this).off('click');
		});
		/* create lists */
		this.dialog.lists.find('tbody').empty();
		for (var i=0;i<filtersearch.length;i++)
		{
			var filter=filtersearch[i];
			var list=this.template.clone(true);
			$.each(filter,function(key,values){
				list.append($('<input type="hidden" id="'+key+'">').val(values.value));
			});
			$.each(my.displaytext,function(index){
				list.find('td').eq(index).html(filter[my.displaytext[index]].value);
			});
			my.dialog.lists.find('tbody').append(list);
		}
	},
	/* display referer */
	show:function(options){
		var options=$.extend({
			buttons:{},
			callback:null
		},options);
		var my=this;
		var height=0;
		var margin=0;
		var lists=this.dialog.lists.find('tbody').find('tr');
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){if (values!=null) values();});
		});
		/* lists callback */
		$.each(lists,function(index){
			var list=$(this);
			$(this).off('click').on('click',function(){if (options.callback!=null) options.callback(list);});
		});
		this.callback=options.callback;
		this.dialog.cover.show();
		/* focus in search field */
		var searches=this.dialog.header.find('input[type=text],select');
		if (searches.length!=0) searches.eq(0).focus();
	},
	/* hide referer */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.referer=function(options){
	var options=$.extend({
		container:null,
		datasource:null,
		displaytext:[],
		searches:[]
	},options);
	options.container=this;
	return new Referer(options);
};
/*
*--------------------------------------------------------------------
* FileSelect
* -------------------------------------------------------------------
*/
var FileSelect=function(options){
	var options=$.extend({
		container:null
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.dialog=createdialog(600,500);
	/* append elements */
	this.dialog.header
	.append(
		$('<input type="file">').css({'display':'none'}).on('change',function(){
			var target=$(this);
			if (target[0].files.length!=0)
				my.upload(target[0].files[0]).then(function(res){
					var values={
						contentType:target[0].files[0].type,
						fileKey:JSON.parse(res).fileKey,
						name:target[0].files[0].name
					};
					my.addrow(values);
				});
		})
	)
	.append(
		button.clone(true).css({'width':'100%'})
		.text('ファイルを追加')
		.on('click',function(){
			$(this).closest('div').find('input').click();
		})
	);
	this.dialog.contents.append(this.dialog.lists);
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(this.dialog.header);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container.css({'padding-top':'40px'}));
	options.container.append(this.dialog.cover);
	/* create template */
	this.template=$('<tr>')
	.append(
		cell.clone(true).css({
			'border':'none',
			'border-bottom':'1px dotted #3498db',
			'padding':'0px 5px'
		})
		.append(
			$('<a href="" id="link">').on('click',function(e){
				var list=$(this).closest('tr');
				my.download(list.find('input#fileKey').val()).then(function(blob){
					if (window.navigator.msSaveBlob) window.navigator.msSaveOrOpenBlob(blob,list.find('input#name').val());
					else
					{
						var url=window.URL || window.webkitURL;
						var a=document.createElement('a');
						a.setAttribute('href',url.createObjectURL(blob));
						a.setAttribute('target','_blank');
						a.setAttribute('download',list.find('input#name').val());
						a.style.display='none';
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
					}
				});
				e.preventDefault();
				e.stopPropagation();
				return false;
			})
		)
		.append($('<input type="hidden" id="contentType">'))
		.append($('<input type="hidden" id="fileKey">'))
		.append($('<input type="hidden" id="name">'))
	)
	.append(
		cell.clone(true).css({
			'border':'none',
			'border-bottom':'1px dotted #3498db',
			'width':'30px'
		})
		.append(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" alt="削除" title="削除">')
			.css({'vertical-align':'middle;','width':'100%'})
			.on('click',function(){
				$(this).closest('tr').remove();
			})
		)
	);
};
FileSelect.prototype={
	/* download */
	download:function(fileKey)
	{
		return new Promise(function(resolve,reject)
		{
			var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
			var xhr=new XMLHttpRequest();
			xhr.open('GET',url);
			xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
			xhr.responseType='blob';
			xhr.onload=function(){
				if (xhr.status===200) resolve(xhr.response);
				else reject(Error('File download error:' + xhr.statusText));
			};
			xhr.onerror=function(){
				reject(Error('There was a network error.'));
			};
			xhr.send();
		});
	},
	/* upload */
	upload:function(file){
		return new Promise(function(resolve,reject)
		{
			var blob=new Blob([file],{type:file.type});
			var filedata=new FormData();
			var xhr=new XMLHttpRequest();
			filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
			filedata.append('file',blob,file.name);
			xhr.open('POST',encodeURI('/k/v1/file.json'),false);
			xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
			xhr.responseType='multipart/form-data';
			xhr.onload=function(){
				if (xhr.status===200) resolve(xhr.responseText);
				else reject(Error('File upload error:' + xhr.statusText));
			};
			xhr.onerror=function(){
				reject(Error('There was a network error.'));
			};
			xhr.send(filedata);
		});
	},
	/* add row */
	addrow:function(values){
		var list=this.template.clone(true);
		list.find('input#contentType').val(values.contentType);
		list.find('input#fileKey').val(values.fileKey);
		list.find('input#name').val(values.name);
		list.find('a#link').text(values.name);
		this.dialog.lists.find('tbody').append(list);
	},
	/* display referer */
	show:function(options){
		var options=$.extend({
			datasource:[],
			buttons:{}
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var res=[];
						$.each(my.dialog.lists.find('tbody').find('tr'),function(){
							res.push({
								contentType:$(this).find('input#contentType').val(),
								fileKey:$(this).find('input#fileKey').val(),
								name:$(this).find('input#name').val()
							});
						});
						values(res);
					}
				});
		});
		/* create lists */
		this.dialog.lists.find('tbody').empty();
		$.each(options.datasource,function(index){my.addrow(options.datasource[index]);});
		this.dialog.cover.show();
	},
	/* hide referer */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.fileselect=function(){
	return new FileSelect({container:$(this)});
};
/*
*--------------------------------------------------------------------
* MultiSelect
* -------------------------------------------------------------------
*/
var MultiSelect=function(options){
	var options=$.extend({
		container:null
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.dialog=createdialog(600,500);
	this.selection={};
	/* append elements */
	this.dialog.contents.append(this.dialog.lists);
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container);
	options.container.append(this.dialog.cover);
	/* create template */
	this.template=$('<tr>')
	.append(
		cell.clone(true).css({'padding':'5px'})
		.on('click',function(){
			if ($(this).find('input').val() in my.selection)
			{
				$(this).css({'background-color':'transparent'});
				delete my.selection[$(this).find('input').val()];
			}
			else
			{
				$(this).css({'background-color':'#a0d8ef'});
				my.selection[$(this).find('input').val()]=$(this).find('span').text();
			}
		})
	)
	.on('mouseover',function(e){$(this).css({'background-color':'#f5b2b2'});})
	.on('mouseout',function(e){$(this).css({'background-color':'transparent'});});
};
MultiSelect.prototype={
	/* display referer */
	show:function(options){
		var options=$.extend({
			datasource:[],
			buttons:{},
			selected:[]
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){if (values!=null) values(my.selection);});
		});
		/* create lists */
		this.dialog.lists.find('tbody').empty();
		this.selection={};
		$.each(options.datasource,function(index){
			var list=my.template.clone(true);
			var listtext=options.datasource[index].text;
			var listvalue=options.datasource[index].value;
			$('span',list).html(listtext);
			$('input[type=hidden]',list).val(listvalue);
			if ($.inArray(listvalue,options.selected)>-1)
			{
				list.find('td').css({'background-color':'#a0d8ef'});;
				my.selection[listvalue]=listtext;
			}
			else $(this).css({'background-color':'transparent'});
			my.dialog.lists.find('tbody').append(list);
		});
		this.dialog.cover.show();
	},
	/* hide referer */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.multiselect=function(options){
	return new MultiSelect({container:$(this)});
};
/*
*--------------------------------------------------------------------
* TermSelect
*--------------------------------------------------------------------
* parameters
* options	@ minutespan		:minute span
*       	@ isadd				:enable user append
*       	@ isdatepick		:use datepicker
*       	@ issingle			:starttime only
* -------------------------------------------------------------------
*/
var TermSelect=function(options){
	var options=$.extend({
		container:null,
		minutespan:30,
		isadd:false,
		isdatepick:false,
		issingle:false,
		istimeonly:false
	},options);
	/* valiable */
	var my=this;
	var pluswidth=0;
	if (this.isadd) pluswidth+=60;
	/* property */
	this.isadd=options.isadd;
	this.isdatepick=options.isdatepick;
	this.issingle=options.issingle;
	this.istimeonly=options.istimeonly;
	this.dialog=createdialog(500,(((!options.issingle)?545:365)+pluswidth));
	/* append elements */
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container);
	options.container.append(this.dialog.cover);
	/* create template */
	this.hour=select.clone(true);
	this.minute=select.clone(true);
	for (var i=0;i<60;i+=options.minutespan) this.minute.append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)))
	this.template=div.clone(true).addClass('term').css({
		'border-bottom':'1px dotted #3498db',
		'padding':'5px 0px',
		'width':'100%'
	})
	.append(
		div.clone(true).css({
			'display':'inline-block',
			'min-height':'30px',
			'width':'150px'
		})
		.append(span.clone(true).addClass('date'))
	)
	.append(this.hour.clone(true).addClass('starthour'))
	.append(span.clone(true).text('：'))
	.append(this.minute.clone(true).addClass('startminute').val('00'))
	.append(span.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).html('&nbsp;~&nbsp;'))
	.append(this.hour.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).addClass('endhour'))
	.append(span.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).text('：'))
	.append(this.minute.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).addClass('endminute').val('00'));
	/* add row */
	if (options.isadd)
	{
		this.template
		.append(
			span.clone(true).css({'padding':'0px'})
			.append(
				$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/add.png" class="add" alt="追加" title="追加">')
				.css({
					'cursor':'pointer',
					'vertical-align':'top',
					'width':'30px'
				})
				.on('click',function(){
					var row=my.template.clone(true);
					$('.del',row).show();
					my.dialog.contents.append(row);
				})
			)
		)
		.append(
			span.clone(true).css({'padding':'0px'})
			.append(
				$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" class="del" alt="削除" title="削除">')
				.css({
					'cursor':'pointer',
					'display':'none',
					'vertical-align':'top',
					'width':'30px'
				})
				.on('click',function(){
					$(this).closest('.term').remove();
				})
			)
		);
	}
	/* day pickup */
	if (options.isdatepick && !options.istimeonly)
	{
		this.template.find('.date').closest('div').css({'padding-left':'30px'})
		.append(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/calendar.png" alt="カレンダー" title="カレンダー">')
			.css({
				'position':'absolute',
				'left':'0px',
				'top':'0px',
				'width':'30px'
			})
			.on('click',function(){
				activerow=$(this).closest('div');
				my.calendar.show({activedate:new Date($('.date',$(this).closest('div')).text().dateformat())});
			})
		);
	}
	/* day pickup */
	if (options.isdatepick && !options.istimeonly)
	{
		var activerow=null;
		this.calendar=$('body').calendar({
			selected:function(target,value){
				$('.date',activerow).text(value);
			}
		});
	}
};
TermSelect.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			fromhour:0,
			tohour:23,
			dates:[],
			starttimes:[],
			endtimes:[],
			buttons:{}
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var date='';
						var starttime='';
						var endtime='';
						var times=0;
						var datetimes=[];
						$.each($('div.term',my.dialog.container),function(){
							var row=$(this);
							if ($('.date',row).text().length==0) return true;
							date=(!my.istimeonly)?$('.date',row).text():new Date().format('Y-m-d');
							starttime=$('.starthour',row).val()+':'+$('.startminute',row).val();
							endtime=$('.endhour',row).val()+':'+$('.endminute',row).val();
							if (!my.issingle)
							{
								if (parseInt(starttime)>parseInt(endtime))
								{
									starttime=$('.endhour',row).val()+':'+$('.endminute',row).val();
									endtime=$('.starthour',row).val()+':'+$('.startminute',row).val();
								}
								times=0;
								times+=new Date((date+'T'+endtime+':00+09:00').dateformat()).getTime();
								times-=new Date((date+'T'+starttime+':00+09:00').dateformat()).getTime();
							}
							datetimes.push({
								date:date,
								starttime:starttime,
								endtime:endtime,
								hours:times/(1000*60*60)
							});
						});
						values(datetimes);
					}
				});
		});
		this.dialog.contents.empty();
		$('.starthour',this.template).empty();
		$('.endhour',this.template).empty();
		for (var i=options.fromhour;i<options.tohour+1;i++)
		{
			$('.starthour',this.template).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
			$('.endhour',this.template).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
		}
		for (var i=0;i<options.dates.length;i++)
		{
			var row=this.template.clone(true);
			if (options.starttimes.length>i)
			{
				$('.starthour',row).val(options.starttimes[i].split(':')[0]);
				$('.startminute',row).val(options.starttimes[i].split(':')[1]);
			}
			else $('.starthour',row).val($('.starthour',row).find('option').first().val());
			if (options.endtimes.length>i)
			{
				$('.endhour',row).val(options.endtimes[i].split(':')[0]);
				$('.endminute',row).val(options.endtimes[i].split(':')[1]);
			}
			else $('.endhour',row).val($('.endhour',row).find('option').first().val());
			$('.date',row).text(options.dates[i]);
			this.dialog.contents.append(row);
		}
		if (this.isadd && options.dates.length==0) this.dialog.contents.append(this.template.clone(true));
		this.dialog.cover.show();
	},
	/* hide calendar */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.termselect=function(options){
	var options=$.extend({
		container:null,
		minutespan:30,
		isdatepick:false,
		issingle:false,
		istimeonly:false
	},options);
	options.container=this;
	return new TermSelect(options);
};
/*
*--------------------------------------------------------------------
* FieldsForm
*--------------------------------------------------------------------
* parameters
* options	@ fields			:field informations
* -------------------------------------------------------------------
*/
var FieldsForm=function(options){
	var options=$.extend({
		container:null,
		fields:[],
		callback:{
			group:null,
			organization:null,
			user:null
		},
		radionulllabel:''
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.fields=options.fields;
	this.callback=options.callback;
	this.radionulllabel=options.radionulllabel;
	this.dialog=createdialog(0,600);
	this.groupsource=null;
	this.organizationsource=null;
	this.usersource=null;
	this.apps={};
	this.offset={};
	this.referer={};
	/* append elements */
	this.fieldcontainer=div.clone(true).addClass('container').css({'padding':'5px','width':'100%'}).append(title.clone(true));
	for (var i=0;i<this.fields.length;i++)
	{
		var fieldinfo=this.fields[i];
		var fieldcontainer=this.fieldcontainer.clone(true).attr('id',fieldinfo.code);
		var fieldoptions=[];
		var receiver=null;
		fieldcontainer.find('.title').text(fieldinfo.label);
		switch (fieldinfo.type)
		{
			case 'CHECK_BOX':
			case 'MULTI_SELECT':
				fieldoptions=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					fieldoptions[values.index]=values.label;
				});
				for (var i2=0;i2<fieldoptions.length;i2++)
				{
					receiver=checkbox.clone(true);
					$('.label',receiver).html(fieldoptions[i2]);
					$('.receiver',receiver).attr('id',fieldoptions[i2]).val(fieldoptions[i2]);
					fieldcontainer.append(receiver);
				}
				break;
			case 'DATE':
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					/* day pickup */
					var calendar=$('body').calendar({
						selected:function(cell,value){
							target.closest('.container').find('.label').text(value);
							target.closest('.container').find('.receiver').val(value);
						}
					});
					calendar.show({activedate:new Date(target.closest('.container').find('.label').text().dateformat())});
				});
				fieldcontainer.append(receiver);
				break;
			case 'DATETIME':
				receiver=referer.clone(true).append(time.clone(true));
				$('.label',receiver).css({'width':'calc(100% - 150px)'});
				$('.button',receiver).on('click',function(){
					var target=$(this);
					/* day pickup */
					var calendar=$('body').calendar({
						selected:function(cell,value){
							target.closest('.container').find('.label').text(value);
							target.closest('.container').find('.receiver').val(my.datetimevalue(target.closest('.container')));
						}
					});
					calendar.show({activedate:new Date(target.closest('.container').find('.label').text().dateformat())});
				});
				$('.receiverhour',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.datetimevalue($(this).closest('.container')));
				});
				$('.receiverminute',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.datetimevalue($(this).closest('.container')));
				});
				fieldcontainer.append(receiver);
				break;
			case 'DROP_DOWN':
				receiver=select.clone(true).addClass('receiver').css({'display':'block','width':'100%'});
				receiver.append($('<option>').attr('value','').text(''));
				fieldoptions=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					fieldoptions[values.index]=values.label;
				});
				for (var i2=0;i2<fieldoptions.length;i2++) receiver.append($('<option>').attr('value',fieldoptions[i2]).html(fieldoptions[i2]));
				fieldcontainer.append(receiver);
				break;
			case 'FILE':
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.filebox.show({
						datasource:((target.closest('.container').find('.receiver').val().length!=0)?JSON.parse(target.closest('.container').find('.receiver').val()):[]),
						buttons:{
							ok:function(resp){
								var files=my.filevalue(resp);
								target.closest('.container').find('.label').text(files.names);
								target.closest('.container').find('.receiver').val(files.values);
								/* close the filebox */
								my.filebox.hide();
							},
							cancel:function(){
								/* close the filebox */
								my.filebox.hide();
							}
						}
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'GROUP_SELECT':
				/* load group datas */
				if (this.groupsource==null)
				{
					this.groupsource=[];
					$.loadgroups(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.groupsource.push({value:values.code,text:values.name});
						});
						if (my.callback.group) my.callback.group();
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.groupsource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'LINK':
			case 'SINGLE_LINE_TEXT':
				if (fieldinfo.lookup)
				{
					this.apps[fieldinfo.code]=null;
					this.offset[fieldinfo.code]=0;
					this.loaddatas(fieldinfo);
					receiver=referer.clone(true);
					$('.key',receiver).val(fieldinfo.lookup.relatedKeyField);
					$('.picker',receiver).val(fieldinfo.lookup.lookupPickerFields[0]);
					$('.button',receiver).on('click',function(){
						var target=$(this);
						my.referer[target.closest('.container').attr('id')].show({
							buttons:{
								cancel:function(){
									/* close the reference box */
									my.referer[target.closest('.container').attr('id')].hide();
								}
							},
							callback:function(row){
								target.closest('.container').find('.label').html(row.find('#'+target.closest('.container').find('.picker').val()).val());
								target.closest('.container').find('.receiver').val(row.find('#'+target.closest('.container').find('.key').val()).val());
								/* close the reference box */
								my.referer[target.closest('.container').attr('id')].hide();
							}
						});
					});
				}
				else receiver=textline.clone(true).addClass('receiver');
				fieldcontainer.append(receiver);
				break;
			case 'MULTI_LINE_TEXT':
			case 'RICH_TEXT':
				receiver=textarea.clone(true).addClass('receiver');
				fieldcontainer.append(receiver);
				break;
			case 'NUMBER':
				if (fieldinfo.lookup)
				{
					this.apps[fieldinfo.code]=null;
					this.offset[fieldinfo.code]=0;
					this.loaddatas(fieldinfo);
					receiver=referer.clone(true);
					$('.key',receiver).val(fieldinfo.lookup.relatedKeyField);
					$('.picker',receiver).val(fieldinfo.lookup.lookupPickerFields[0]);
					$('.button',receiver).on('click',function(){
						var target=$(this);
						my.referer[target.closest('.container').attr('id')].show({
							buttons:{
								cancel:function(){
									/* close the reference box */
									my.referer[target.closest('.container').attr('id')].hide();
								}
							},
							callback:function(row){
								target.closest('.container').find('.label').html(row.find('#'+target.closest('.container').find('.picker').val()).val());
								target.closest('.container').find('.receiver').val(row.find('#'+target.closest('.container').find('.key').val()).val());
								/* close the reference box */
								my.referer[target.closest('.container').attr('id')].hide();
							}
						});
					});
				}
				else
				{
					receiver=textline.clone(true).addClass('receiver');
					$('.receiver',receiver).css({'text-align':'right'});
				}
				fieldcontainer.append(receiver);
				break;
			case 'ORGANIZATION_SELECT':
				/* load organization datas */
				if (this.organizationsource==null)
				{
					this.organizationsource=[];
					$.loadorganizations(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.organizationsource.push({value:values.code,text:values.name});
						});
						if (my.callback.organization) my.callback.organization();
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.organizationsource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'RADIO_BUTTON':
				var checked=true;
				fieldoptions=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					fieldoptions[values.index]=values.label;
				});
				if (this.radionulllabel.length!=0)
				{
					receiver=radio.clone(true);
					$('.label',receiver).html(this.radionulllabel);
					$('.receiver',receiver).attr('id',this.radionulllabel).attr('name',fieldinfo.code).val('').prop('checked',checked);
					fieldcontainer.append(receiver);
					checked=false;
				}
				for (var i2=0;i2<fieldoptions.length;i2++)
				{
					receiver=radio.clone(true);
					$('.label',receiver).html(fieldoptions[i2]);
					$('.receiver',receiver).attr('id',fieldoptions[i2]).attr('name',fieldinfo.code).val(fieldoptions[i2]).prop('checked',checked);
					fieldcontainer.append(receiver);
					checked=false;
				}
				break;
			case 'TIME':
				receiver=time.clone(true);
				receiver.append($('<input type="hidden" class="receiver">').val('00:00'))
				$('.receiverhour',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.timevalue($(this).closest('.container')));
				});
				$('.receiverminute',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.timevalue($(this).closest('.container')));
				});
				fieldcontainer.append(receiver);
				break;
			case 'USER_SELECT':
				/* load user datas */
				if (this.usersource==null)
				{
					this.usersource=[];
					$.loadusers(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.usersource.push({value:values.code,text:values.name});
						});
						if (my.callback.user) my.callback.user();
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.usersource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
		}
		this.dialog.contents.append(fieldcontainer);
	}
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container);
	options.container.append(this.dialog.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.dialog.container.css({'height':(my.dialog.contents.outerHeight()+45).toString()+'px'});
	});
	/* create filebox */
	this.filebox=$('body').fileselect();
	/* create selectbox */
	this.selectbox=$('body').multiselect();
};
FieldsForm.prototype={
	/* create datetime value */
	datetimevalue:function(container){
		var date=container.find('.label').text();
		var receiverhour=container.find('.receiverhour');
		var receiverminute=container.find('.receiverminute');
		if (date.length==0) return '';
		else return date+'T'+receiverhour.val()+':'+receiverminute.val()+':00+0900';
	},
	/* create file values */
	filevalue:function(files){
		var names='';
		var values=[];
		if (files)
			$.each(files,function(index){
				names+=files[index].name+',';
				values.push({
					contentType:files[index].contentType,
					fileKey:files[index].fileKey,
					name:files[index].name
				});
			});
		names=names.replace(/,$/g,'');
		return {names:names,values:JSON.stringify(values)};
	},
	/* create time value */
	timevalue:function(container){
		var receiverhour=container.find('.receiverhour');
		var receiverminute=container.find('.receiverminute');
		return receiverhour.val()+':'+receiverminute.val();
	},
	/* load looup datas */
	loaddatas:function(fieldinfo){
		var my=this;
		var limit=500;
		kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:fieldinfo.lookup.relatedApp.app,query:'order by $id asc limit '+limit.toString()+' offset '+this.offset[fieldinfo.code].toString()},function(resp){
			if (my.apps[fieldinfo.code]==null) my.apps[fieldinfo.code]=resp.records;
			else Array.prototype.push.apply(my.apps[fieldinfo.code],resp.records);
			my.offset[fieldinfo.code]+=limit;
			if (resp.records.length==limit) my.loaddatas(fieldinfo);
			else
			{
				/* create reference box */
				my.referer[fieldinfo.code]=$('body').referer({
					datasource:my.apps[fieldinfo.code],
					displaytext:fieldinfo.lookup.lookupPickerFields
				});
			}
		},function(error){});
	},
	/* display form */
	show:function(options){
		var options=$.extend({
			buttons:{},
			values:{}
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){if (values!=null) values();});
		});
		$.each(options.values,function(key,values){
			if (key.match(/^\$/g)) return true;
			if (!$('#'+key,my.dialog.contents).size()) return true;
			var fieldcontainer=$('#'+key,my.dialog.contents);
			switch (values.type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					/* clear value */
					$.each($('input[type=checkbox]',fieldcontainer),function(){
						$(this).prop('checked',false);
					});
					/* initialize value */
					for (var i=0;i<values.value.length;i++) $('#'+values.value[i].replace(/'/g,'\\\''),fieldcontainer).prop('checked',true);
					break;
				case 'DATE':
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					if (!values.value) return true;
					/* initialize value */
					$('.label',fieldcontainer).text(values.value);
					$('.receiver',fieldcontainer).val(values.value);
					break;
				case 'DATETIME':
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					$('.receiverhour',fieldcontainer).val('00');
					$('.receiverminute',fieldcontainer).val('00');
					if (!values.value) return true;
					/* initialize value */
					$('.label',fieldcontainer).text(new Date(values.value.dateformat()).format('Y-m-d'));
					$('.receiver',fieldcontainer).val(values.value);
					$('.receiverhour',fieldcontainer).val(new Date(values.value.dateformat()).format('H'));
					$('.receiverminute',fieldcontainer).val(new Date(values.value.dateformat()).format('i'));
					break;
				case 'FILE':
					var files=my.filevalue(values.value);
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					/* initialize value */
					$('.label',fieldcontainer).text(files.names);
					$('.receiver',fieldcontainer).val(files.values);
					break;
				case 'GROUP_SELECT':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					var label=[];
					var receiver=[];
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					/* initialize value */
					$.each(values.value,function(index){
						label.push(values.value[index].name);
						receiver.push(values.value[index].code);
					});
					$('.label',fieldcontainer).text(label.join(','));
					$('.receiver',fieldcontainer).val(receiver.join(','));
					break;
				case 'RADIO_BUTTON':
					$('#'+values.value.replace(/'/g,'\\\''),fieldcontainer).prop('checked',true);
					break;
				case 'TIME':
					/* clear value */
					$('.receiver',fieldcontainer).val('');
					$('.receiverhour',fieldcontainer).val('00');
					$('.receiverminute',fieldcontainer).val('00');
					if (!values.value) return true;
					/* initialize value */
					$('.receiver',fieldcontainer).val(values.value);
					$('.receiverhour',fieldcontainer).val(('0'+values.value.split(':')[0]).slice(-2));
					$('.receiverminute',fieldcontainer).val(('0'+values.value.split(':')[1]).slice(-2));
					break;
				default:
					/* clear value */
					$('.receiver',fieldcontainer).val('');
					/* initialize value */
					if (key in my.apps)
					{
						$('.label',fieldcontainer).text('');
						for (var i=0;i<my.apps[key].length;i++)
							if (my.apps[key][i][$('.key',fieldcontainer).val()].value==values.value)
								$('.label',fieldcontainer).html(my.apps[key][i][$('.picker',fieldcontainer).val()].value);
					}
					$('.receiver',fieldcontainer).val(values.value);
					break;
			}
		});
		this.dialog.cover.show();
		/* adjust container height */
		this.dialog.container.css({'height':(this.dialog.contents.outerHeight()+45).toString()+'px'});
	},
	/* hide form */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.fieldsform=function(options){
	var options=$.extend({
		container:null,
		fields:{}
	},options);
	options.container=this;
	return new FieldsForm(options);
};
/*
*--------------------------------------------------------------------
* ConditionsForm
*--------------------------------------------------------------------
* parameters
* options	@ fields			:field informations
* -------------------------------------------------------------------
*/
var ConditionsForm=function(options){
	var options=$.extend({
		container:null,
		fields:[]
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.fields=options.fields;
	this.dialog=createdialog(0,600);
	this.groupsource=null;
	this.organizationsource=null;
	this.usersource=null;
	this.apps={};
	this.offset={};
	this.referer={};
	/* append elements */
	this.fieldcontainer=div.clone(true).addClass('container').css({'padding':'5px','width':'100%'})
	.append(title.clone(true))
	.append(
		select.clone(true).addClass('comp').css({'display':'block'})
		.append($('<option>').attr('value','').text('指定しない'))
	)
	.append($('<input type="hidden" class="type">'));
	for (var i=0;i<this.fields.length;i++)
	{
		var comp=null;
		var receiver=null;
		var fieldinfo=this.fields[i];
		var fieldcontainer=this.fieldcontainer.clone(true).attr('id',fieldinfo.code);
		var fieldoptions=[];
		fieldcontainer.find('.title').text(fieldinfo.label);
		fieldcontainer.find('.type').val(fieldinfo.type);
		switch (fieldinfo.type)
		{
			case 'CALC':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'));
				switch(fieldinfo.format.toUpperCase())
				{
					case 'NUMBER':
					case 'NUMBER_DIGIT':
						comp
						.append($('<option>').attr('value','2').text('以下'))
						.append($('<option>').attr('value','3').text('以上'));
						break;
					case 'DATE':
					case 'DATETIME':
					case 'TIME':
					case 'HOUR_MINUTE':
					case 'DAY_HOUR_MINUTE':
						comp
						.append($('<option>').attr('value','2').text('以前'))
						.append($('<option>').attr('value','3').text('より前'))
						.append($('<option>').attr('value','4').text('以降'))
						.append($('<option>').attr('value','5').text('より後'));
						break;
				}
				receiver=textline.clone(true).addClass('receiver');
				$('.receiver',receiver).css({'text-align':'right'});
				fieldcontainer.append(receiver);
				break;
			case 'CHECK_BOX':
			case 'DROP_DOWN':
			case 'MULTI_SELECT':
			case 'RADIO_BUTTON':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('次のいずれかを含む'))
				.append($('<option>').attr('value','1').text('次のいずれも含まない'));
				fieldoptions=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					fieldoptions[values.index]=values.label;
				});
				for (var i2=0;i2<fieldoptions.length;i2++)
				{
					receiver=checkbox.clone(true);
					$('.label',receiver).html(fieldoptions[i2]);
					$('.receiver',receiver).attr('id',fieldoptions[i2]).val(fieldoptions[i2]);
					fieldcontainer.append(receiver);
				}
				break;
			case 'CREATED_TIME':
			case 'DATETIME':
			case 'UPDATED_TIME':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'))
				.append($('<option>').attr('value','2').text('以前'))
				.append($('<option>').attr('value','3').text('より前'))
				.append($('<option>').attr('value','4').text('以降'))
				.append($('<option>').attr('value','5').text('より後'));
				receiver=referer.clone(true).append(time.clone(true));
				$('.label',receiver).css({'width':'calc(100% - 150px)'});
				$('.button',receiver).on('click',function(){
					var target=$(this);
					/* day pickup */
					var calendar=$('body').calendar({
						selected:function(cell,value){
							target.closest('.container').find('.label').text(value);
							target.closest('.container').find('.receiver').val(my.datetimevalue(target.closest('.container')));
						}
					});
					calendar.show({activedate:new Date(target.closest('.container').find('.label').text().dateformat())});
				});
				$('.receiverhour',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.datetimevalue($(this).closest('.container')));
				});
				$('.receiverminute',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.datetimevalue($(this).closest('.container')));
				});
				fieldcontainer.append(receiver);
				break;
			case 'CREATOR':
			case 'MODIFIER':
			case 'USER_SELECT':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('次のいずれかを含む'))
				.append($('<option>').attr('value','1').text('次のいずれも含まない'));
				/* load user datas */
				if (this.usersource==null)
				{
					this.usersource=[];
					$.loadusers(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.usersource.push({value:values.code,text:values.name});
						});
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.usersource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'DATE':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'))
				.append($('<option>').attr('value','2').text('以前'))
				.append($('<option>').attr('value','3').text('より前'))
				.append($('<option>').attr('value','4').text('以降'))
				.append($('<option>').attr('value','5').text('より後'));
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					/* day pickup */
					var calendar=$('body').calendar({
						selected:function(cell,value){
							target.closest('.container').find('.label').text(value);
							target.closest('.container').find('.receiver').val(value);
						}
					});
					calendar.show({activedate:new Date(target.closest('.container').find('.label').text().dateformat())});
				});
				fieldcontainer.append(receiver);
				break;
			case 'GROUP_SELECT':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('次のいずれかを含む'))
				.append($('<option>').attr('value','1').text('次のいずれも含まない'));
				/* load group datas */
				if (this.groupsource==null)
				{
					this.groupsource=[];
					$.loadgroups(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.groupsource.push({value:values.code,text:values.name});
						});
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.groupsource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'LINK':
			case 'SINGLE_LINE_TEXT':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'))
				.append($('<option>').attr('value','2').text('次のキーワードを含む'))
				.append($('<option>').attr('value','3').text('次のキーワードを含まない'));
				if (fieldinfo.lookup)
				{
					this.apps[fieldinfo.code]=null;
					this.offset[fieldinfo.code]=0;
					this.loaddatas(fieldinfo);
					receiver=referer.clone(true);
					$('.key',receiver).val(fieldinfo.lookup.relatedKeyField);
					$('.picker',receiver).val(fieldinfo.lookup.lookupPickerFields[0]);
					$('.button',receiver).on('click',function(){
						var target=$(this);
						my.referer[target.closest('.container').attr('id')].show({
							buttons:{
								cancel:function(){
									/* close the reference box */
									my.referer[target.closest('.container').attr('id')].hide();
								}
							},
							callback:function(row){
								target.closest('.container').find('.label').html(row.find('#'+target.closest('.container').find('.picker').val()).val());
								target.closest('.container').find('.receiver').val(row.find('#'+target.closest('.container').find('.key').val()).val());
								/* close the reference box */
								my.referer[target.closest('.container').attr('id')].hide();
							}
						});
					});
				}
				else receiver=textline.clone(true).addClass('receiver');
				fieldcontainer.append(receiver);
				break;
			case 'MULTI_LINE_TEXT':
			case 'RICH_TEXT':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('次のキーワードを含む'))
				.append($('<option>').attr('value','1').text('次のキーワードを含まない'));
				receiver=textline.clone(true).addClass('receiver');
				fieldcontainer.append(receiver);
				break;
			case 'NUMBER':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'))
				.append($('<option>').attr('value','2').text('以下'))
				.append($('<option>').attr('value','3').text('以上'));
				if (fieldinfo.lookup)
				{
					this.apps[fieldinfo.code]=null;
					this.offset[fieldinfo.code]=0;
					this.loaddatas(fieldinfo);
					receiver=referer.clone(true);
					$('.key',receiver).val(fieldinfo.lookup.relatedKeyField);
					$('.picker',receiver).val(fieldinfo.lookup.lookupPickerFields[0]);
					$('.button',receiver).on('click',function(){
						var target=$(this);
						my.referer[target.closest('.container').attr('id')].show({
							buttons:{
								cancel:function(){
									/* close the reference box */
									my.referer[target.closest('.container').attr('id')].hide();
								}
							},
							callback:function(row){
								target.closest('.container').find('.label').html(row.find('#'+target.closest('.container').find('.picker').val()).val());
								target.closest('.container').find('.receiver').val(row.find('#'+target.closest('.container').find('.key').val()).val());
								/* close the reference box */
								my.referer[target.closest('.container').attr('id')].hide();
							}
						});
					});
				}
				else
				{
					receiver=textline.clone(true).addClass('receiver');
					$('.receiver',receiver).css({'text-align':'right'});
				}
				fieldcontainer.append(receiver);
				break;
			case 'ORGANIZATION_SELECT':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('次のいずれかを含む'))
				.append($('<option>').attr('value','1').text('次のいずれも含まない'));
				/* load organization datas */
				if (this.organizationsource==null)
				{
					this.organizationsource=[];
					$.loadorganizations(function(records){
						records.sort(function(a,b){
							if(parseInt(a.id)<parseInt(b.id)) return -1;
							if(parseInt(a.id)>parseInt(b.id)) return 1;
							return 0;
						});
						$.each(records,function(index,values){
							my.organizationsource.push({value:values.code,text:values.name});
						});
					});
				}
				receiver=referer.clone(true);
				$('.button',receiver).on('click',function(){
					var target=$(this);
					my.selectbox.show({
						datasource:my.organizationsource,
						buttons:{
							ok:function(selection){
								target.closest('.container').find('.label').text(Object.values(selection).join(','));
								target.closest('.container').find('.receiver').val(Object.keys(selection).join(','));
								/* close the selectbox */
								my.selectbox.hide();
							},
							cancel:function(){
								/* close the selectbox */
								my.selectbox.hide();
							}
						},
						selected:target.closest('.container').find('.receiver').val().split(',')
					});
				});
				fieldcontainer.append(receiver);
				break;
			case 'TIME':
				comp=fieldcontainer.find('.comp')
				.append($('<option>').attr('value','0').text('等しい'))
				.append($('<option>').attr('value','1').text('等しくない'))
				.append($('<option>').attr('value','2').text('以前'))
				.append($('<option>').attr('value','3').text('より前'))
				.append($('<option>').attr('value','4').text('以降'))
				.append($('<option>').attr('value','5').text('より後'));
				receiver=time.clone(true);
				receiver.append($('<input type="hidden" class="receiver">').val('00:00'))
				$('.receiverhour',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.timevalue($(this).closest('.container')));
				});
				$('.receiverminute',receiver).on('change',function(){
					$(this).closest('.container').find('.receiver').val(my.timevalue($(this).closest('.container')));
				});
				fieldcontainer.append(receiver);
				break;
		}
		this.dialog.contents.append(fieldcontainer);
	}
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル').on('click',function(){
			my.hide();
		}))
	);
	this.dialog.cover.append(this.dialog.container);
	options.container.append(this.dialog.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.dialog.container.css({'height':(my.dialog.contents.outerHeight()+45).toString()+'px'});
	});
	/* create selectbox */
	this.selectbox=$('body').multiselect();
};
ConditionsForm.prototype={
	/* create datetime value */
	datetimevalue:function(container){
		var date=container.find('.label').text();
		var receiverhour=container.find('.receiverhour');
		var receiverminute=container.find('.receiverminute');
		if (date.length==0) return '';
		else return date+'T'+receiverhour.val()+':'+receiverminute.val()+':00+0900';
	},
	/* create time value */
	timevalue:function(container){
		var receiverhour=container.find('.receiverhour');
		var receiverminute=container.find('.receiverminute');
		return receiverhour.val()+':'+receiverminute.val();
	},
	/* load looup datas */
	loaddatas:function(fieldinfo){
		var my=this;
		var limit=500;
		kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:fieldinfo.lookup.relatedApp.app,query:'order by $id asc limit '+limit.toString()+' offset '+this.offset[fieldinfo.code].toString()},function(resp){
			if (my.apps[fieldinfo.code]==null) my.apps[fieldinfo.code]=resp.records;
			else Array.prototype.push.apply(my.apps[fieldinfo.code],resp.records);
			my.offset[fieldinfo.code]+=limit;
			if (resp.records.length==limit) my.loaddatas(fieldinfo);
			else
			{
				/* create reference box */
				my.referer[fieldinfo.code]=$('body').referer({
					datasource:my.apps[fieldinfo.code],
					displaytext:fieldinfo.lookup.lookupPickerFields
				});
			}
		},function(error){});
	},
	/* display form */
	show:function(options,callback){
		var options=$.extend({
			values:{}
		},options);
		var my=this;
		$('#ok',this.dialog.footer).on('click',function(){
			var res=[];
			$.each($('.container',my.dialog.contents),function(){
				var container=$(this);
				if ($('.comp',container).val())
				{
					var receivevalue=container.find('.receiver').val();
					var receivevalues=[];
					switch (container.find('.type').val())
					{
						case 'CHECK_BOX':
						case 'DROP_DOWN':
						case 'MULTI_SELECT':
						case 'RADIO_BUTTON':
							$.each(container.find('.receiver:checked'),function(){receivevalues.push($(this).val());});
							res.push({
								field:container.attr('id'),
								comp:$('.comp',container).val(),
								value:receivevalues
							});
							break;
						case 'CREATOR':
						case 'GROUP_SELECT':
						case 'MODIFIER':
						case 'ORGANIZATION_SELECT':
						case 'USER_SELECT':
							var values=receivevalue.split(',');
							for (var i2=0;i2<values.length;i2++) receivevalues.push({code:values[i2]});
							res.push({
								field:container.attr('id'),
								comp:$('.comp',container).val(),
								value:receivevalues
							});
							break;
						default:
							res.push({
								field:container.attr('id'),
								comp:$('.comp',container).val(),
								value:receivevalue
							});
							break;
					}
				}
				callback(res);
			});
			my.hide();
		});
		$.each(options.values,function(key,values){
			if (key.match(/^\$/g)) return true;
			if (!$('#'+key,my.dialog.contents).size()) return true;
			var fieldcontainer=$('#'+key,my.dialog.contents);
			switch (values.type)
			{
				case 'CHECK_BOX':
				case 'DROP_DOWN':
				case 'MULTI_SELECT':
				case 'RADIO_BUTTON':
					/* clear value */
					$.each($('input[type=checkbox]',fieldcontainer),function(){
						$(this).prop('checked',false);
					});
					/* initialize value */
					for (var i=0;i<values.value.length;i++) $('#'+values.value[i].replace(/'/g,'\\\''),fieldcontainer).prop('checked',true);
					break;
				case 'CREATED_TIME':
				case 'DATETIME':
				case 'UPDATED_TIME':
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					$('.receiverhour',fieldcontainer).val('00');
					$('.receiverminute',fieldcontainer).val('00');
					if (!values.value) return true;
					/* initialize value */
					$('.label',fieldcontainer).text(new Date(values.value.dateformat()).format('Y-m-d'));
					$('.receiver',fieldcontainer).val(values.value);
					$('.receiverhour',fieldcontainer).val(new Date(values.value.dateformat()).format('H'));
					$('.receiverminute',fieldcontainer).val(new Date(values.value.dateformat()).format('i'));
					break;
				case 'CREATOR':
				case 'GROUP_SELECT':
				case 'MODIFIER':
				case 'ORGANIZATION_SELECT':
				case 'USER_SELECT':
					var label=[];
					var receiver=[];
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					/* initialize value */
					$.each(values.value,function(index){
						label.push(values.value[index].name);
						receiver.push(values.value[index].code);
					});
					$('.label',fieldcontainer).text(label.join(','));
					$('.receiver',fieldcontainer).val(receiver.join(','));
					break;
				case 'DATE':
					/* clear value */
					$('.label',fieldcontainer).text('');
					$('.receiver',fieldcontainer).val('');
					if (!values.value) return true;
					/* initialize value */
					$('.label',fieldcontainer).text(values.value);
					$('.receiver',fieldcontainer).val(values.value);
					break;
				case 'TIME':
					/* clear value */
					$('.receiver',fieldcontainer).val('');
					$('.receiverhour',fieldcontainer).val('00');
					$('.receiverminute',fieldcontainer).val('00');
					if (!values.value) return true;
					/* initialize value */
					$('.receiver',fieldcontainer).val(values.value);
					$('.receiverhour',fieldcontainer).val(('0'+values.value.split(':')[0]).slice(-2));
					$('.receiverminute',fieldcontainer).val(('0'+values.value.split(':')[1]).slice(-2));
					break;
				default:
					/* clear value */
					$('.receiver',fieldcontainer).val('');
					/* initialize value */
					if (key in my.apps)
					{
						$('.label',fieldcontainer).text('');
						for (var i=0;i<my.apps[key].length;i++)
							if (my.apps[key][i][$('.key',fieldcontainer).val()].value==values.value)
								$('.label',fieldcontainer).html(my.apps[key][i][$('.picker',fieldcontainer).val()].value);
					}
					$('.receiver',fieldcontainer).val(values.value);
					break;
			}
		});
		this.dialog.cover.show();
		/* adjust container height */
		this.dialog.container.css({'height':(this.dialog.contents.outerHeight()+45).toString()+'px'});
	},
	/* hide form */
	hide:function(){
		this.dialog.cover.hide();
	},
	/* redisplay referer */
	unhide:function(){
		this.dialog.cover.show();
	}
};
jQuery.fn.conditionsform=function(options){
	var options=$.extend({
		container:null,
		fields:{}
	},options);
	options.container=this;
	return new ConditionsForm(options);
};
})(jQuery);
