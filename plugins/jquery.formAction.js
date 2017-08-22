/*
*--------------------------------------------------------------------
* jQuery-Plugin "formAction"
* Version: 2.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* parameters
* options @ buttons:指定関数を実行するボタン群
*         @ files  :ファイルアップロードを実行するファイル参照群
*         @ lists  :データロードを実行するコンボボックス群
*         @ texts  :値検証を実行するテキストボックス群
* -------------------------------------------------------------------
*/
jQuery.fn.formAction = function(options){
	var options=$.extend({
		buttons:{},
		radios:{},
		files:{},
		lists:{},
		pagers:{},
		texts:{},
		comma:[],
		date:[]
	},options);
	//キー制御
	$(document).on('keydown','input[type=text],input[type=number],input[type=password],select',function(e){
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var targets=$(this).closest('form').find('button:visible,input[type=number]:visible,input[type=text]:visible,input[type=password]:visible,input[type=button]:visible,textarea:visible,select:visible');
			var total=targets.length;
			var index=targets.index(this);
			targets.eq(index+(e.shiftKey?(index>0?-1:0):(index<total?+1:total))).focus();
			return false;
		}
	});
	$(document).on('keydown','button,input[type=button]',function(e){
		var code=e.keyCode||e.which;
		if ($(this).attr('id')!=null)
		{
			var buttonID=$(this).attr('id');
			if (buttonID.match(/submit[0-9a-z]*/g)!=null) return true;
			if (buttonID.match(/search[0-9a-z]*/g)!=null) return true;
		}
		if (code==13)
		{
			var targets=$(this).closest('form').find('button:visible,input[type=number]:visible,input[type=text]:visible,input[type=password]:visible,input[type=button]:visible,textarea:visible,select:visible');
			var total=targets.length;
			var index=targets.index(this);
			targets.eq(index+(e.shiftKey?(index>0?-1:0):(index<total?+1:total))).focus();
			return false;
		}
	});
	return $(this).each(function(){
		var form=$(this);
		//引数を変数に代入
		$.data(form[0],'comma',options.comma);
		$.data(form[0],'date',options.date);
		//テキストボックス操作(title属性があるテキストボックスはtitle内容を初期表示にする)
		form.find('input[type=text],input[type=number],textarea').each(function(){
			if ($(this).attr('title')!=null)
			{
				$.data(this,'display',$(this).attr('title'));
				$(this).attr('title','');
				if ($(this).val().length==0) $(this).val($.data(this,'display'));
			}
			else $.data(this,'display','');
			$(this).focus(function(){
				if ($(this).val()==$.data(this,'display')) $(this).val('');
			}).blur(function(){
				if ($(this).val().length==0) $(this).val($.data(this,'display'));
			});
		});
		/*
		*------------------------------------------------------------
		* ボタン操作(指定関数を実行)
		*------------------------------------------------------------
		* parameters
		* key   :セレクタ
		* values:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.buttons,function(key,values){
			//イベント追加
			if (values!=null) form.on('click',key,function(e){values($(this),e);});
		});
		/*
		*------------------------------------------------------------
		* ラジオボタン操作(指定関数を実行)
		*------------------------------------------------------------
		* parameters
		* key   :セレクタ
		* values:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.radios,function(key,values){
			//イベント追加
			if (values!=null) form.on('change',key,function(){values($(this));});
		});
		/*
		*------------------------------------------------------------
		* ファイル操作(指定関数を実行)
		*------------------------------------------------------------
		* parameters
		* key:セレクタ
		* values @ url     :アップロード先
		*        @ name    :アップロード時のname属性
		*        @ callback:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.files,function(key,values){
			var values=$.extend({
				url:'',
				name:'',
				iscontinue:false,
				showdetailerror:false,
				callback:null,
				messagecallback:null
			},values);
			//要素チェック
			if (values.name.length==0) {alert('filesにはnameを指定して下さい。');return;}
			//イベント追加
			if (values.url.length!=0) form.on('change',key,function(){
				$(this).off('change');
				var target=$(this);
				//ローディング表示
				if ($('div#loading')!=null) $('div#loading').css('display','block');
				var filedata = null;
				try
				{
					if (target[0].files.length==0)
					{
						//値初期化
						target.val('');
						target.replaceWith(target.clone(true));
						//ローディング消去
						if ($('div#loading')!=null) $('div#loading').css('display','none');
						return;
					}
					//データセット
					filedata = new FormData();
					$.each(target.prop('files'),function(index,file){
						filedata.append(values.name+'['+index+']',file);
					});
					//送信
					$.ajax({
						url:values.url+values.name,
						type:'post',
						data:filedata,
						processData:false,
						contentType:false,
						dataType:'json'
					})
					.done(function(json){
						//値初期化
						target.val('');
						target.replaceWith(target.clone(true));
						if ('error' in json)
							if (json.error.length!=0)
							{
								if (values.messagecallback!=null) values.messagecallback('エラー',json.error);
								else alert(json.error);
								//ローディング消去
								if ($('div#loading')!=null) $('div#loading').css('display','none');
								return;
							}
						if (values.callback!=null)
						{
							if (json.file.length!=1)
							{
								var files=[];
								for (var i=0;i<json.file.length;i++) files[i]=json.file[i];
								values.callback(target,files);
							}
							else values.callback(target,json.file[0]);
						}
						//ローディング消去
						if (!values.iscontinue)
							if ($('div#loading')!=null) $('div#loading').css('display','none');
					})
					.fail(function(XMLHttpRequest,textStatus,errorThrown){
						var errormessage='アップロードに失敗しました。';
						if (values.showdetailerror)
						{
							errormessage='';
							errormessage+='【XMLHttpRequest】'+XMLHttpRequest.status+' ';
							errormessage+='【textStatus】'+textStatus+' ';
							errormessage+='【errorThrown】'+errorThrown.message;
						}
						if (values.messagecallback!=null) values.messagecallback('エラー',errormessage);
						else alert(errormessage);
						//値初期化
						target.val('');
						target.replaceWith(target.clone(true));
						//ローディング消去
						if ($('div#loading')!=null) $('div#loading').css('display','none');
					});
				}
				catch(e)
				{
					if (values.messagecallback!=null) values.messagecallback('エラー','お使いのブラウザでは利用出来ません。');
					else alert('お使いのブラウザでは利用出来ません。');
					//ローディング消去
					if ($('div#loading')!=null) $('div#loading').css('display','none');
				}
			});
		});
		/*
		*------------------------------------------------------------
		* コンボボックス操作
		*------------------------------------------------------------
		* parameters
		* key:セレクタ
		* values @ url     :データ取得先
		*        @ item    :option要素の属性の参照先{label:表示テキスト,value:値}
		*        @ top     :先頭のoption要素{pattern:設定パターン,value:option要素}
		*        @ parent  :動的データ取得時のトリガー要素
		*        @ callback:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.lists,function(key,values){
			var values=$.extend({
				url:'',
				item:{label:'',value:''},
				top:{pattern:'nodata',label:'',value:''},
				parent:'',
				callback:null
			},values);
			form.find(key).each(function(){
				var target=$(this);
				//引数を変数に代入
				$.data(target[0],'options',values);
				//データロード
				target.loaditems('','');
				//動的設定
				var index='';
				if (target.attr('id')!=null) index=target.attr('id').replace(/[^0-9]+/g,'');
				if (values.parent.length!=0) form.on('change',values.parent+index,function(){target.loaditems($(this).val(),'',$.data(target[0],'options').callback);});
				//イベント追加
				if (values.callback!=null) form.on('change',key,function(){$.data(this,'options').callback($(this));});
			});
		});
		/*
		*------------------------------------------------------------
		* ページャー操作
		*------------------------------------------------------------
		* parameters
		* key:セレクタ
		* values @ url        :データ取得先
		*        @ activeback :表示中ページ背景色
		*        @ activefore :表示中ページ文字色
		*        @ linkback   :遷移先ページ背景色
		*        @ linkfore   :遷移先ページ文字色
		*        @ callback   :コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.pagers,function(key,values){
			form.find(key).each(function(){
				var target=$(this);
				//引数を変数に代入
				$.data(target[0],'options',values);
				//データロード
				target.loadpager();
			});
		});
		/*
		*------------------------------------------------------------
		* テキストボックス操作(指定関数を実行)
		*------------------------------------------------------------
		* parameters
		* key   :セレクタ
		* values:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.texts,function(key,values){
			if (values!=null)
			{
				//イベント追加
				form.on('focus',key,function(){$.data(this,'focus',$(this).val());values($(this),'focus');});
				form.on('keyup',key,function(){if ($.data(this,'focus')!=$(this).val()) values($(this),'keyup');});
				form.on('blur',key,function(){if ($.data(this,'focus')!=$(this).val()) values($(this),'blur');});
			}
		});
		/*
		*------------------------------------------------------------
		* カンマ区切り操作
		*------------------------------------------------------------
		* parameters
		* selector:セレクタ
		* -----------------------------------------------------------
		*/
		$.each(options.comma,function(index){
			//イベント追加
			form.on('focus',options.comma[index],function(){
				if ($.inArray($(this).prop('tagName').toLowerCase(),['input','textarea'])!=-1) $(this).val($(this).toVal().replace(/,/g,''));
			});
			form.on('blur',options.comma[index],function(){
				if ($.inArray($(this).prop('tagName').toLowerCase(),['input','textarea'])!=-1)
				{
					if ($.isNumeric($(this).toVal().replace(/,/g,''))) $(this).toComma();
					else $(this).val('');
				}
			});
		});
		/*
		*------------------------------------------------------------
		* 日付フォーマット操作
		*------------------------------------------------------------
		* parameters
		* selector:セレクタ
		* -----------------------------------------------------------
		*/
		$.each(options.date,function(index){
			//イベント追加
			form.on('focus',options.date[index],function(){
				if ($.inArray($(this).prop('tagName').toLowerCase(),['input','textarea'])!=-1) $(this).val($(this).toVal().replace(/[^0-9]+/g,''));
			});
			form.on('blur',options.date[index],function(){
				if ($.inArray($(this).prop('tagName').toLowerCase(),['input','textarea'])!=-1) $(this).toDate();
			});
		});
	});
}
//行追加
jQuery.fn.addrow = function(options){
	var options=$.extend({
		initialframe:'',
		initialimage:''
	},options);
	return $(this).each(function(){
		//要素チェック
		if ($(this).children('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
		var container=$(this).children('tbody');
		//要素コピー
		var row=container.children('tr').last().clone(true);
		//行追加
		container.append(row);
		//要素属性修正
		container.children('tr').last().find('iframe,img,input,textarea,select,label,span').each(function(){
			var index='0';
			var target=$(this);
			//ID修正
			if (target.attr('id')!=null)
			{
				index=target.attr('id').replace(/[^0-9]+/g,'');
				if (index!='') target.attr('id',target.attr('id').split(index).join((parseInt(index)+1).toString()));
			}
			//個別対応
			switch (target.prop('tagName').toLowerCase())
			{
				case 'iframe':
					if (options.initialframe.length!=0) target.attr('src',options.initialframe);
					break;
				case 'img':
					if (options.initialimage.length!=0) target.attr('src',options.initialimage);
					break;
				case 'label':
					if (target.prop('for')!=null)
					{
						index=target.prop('for').replace(/[^0-9]+/g,'');
						if (index!='') target.prop('for',target.prop('for').split(index).join((parseInt(index)+1).toString()));
					}
					break;
				case 'select':
					if ($.data(target[0],'options')!=null)
					{
						//親指定も変更
						if (index!='' && $.data(target[0],'options').parent.length!=0)
						{
							target.closest('form').on('change',$.data(target[0],'options').parent+(parseInt(index)+1).toString(),function(){
								target.loaditems($(this).val(),'');
							});
						}
					}
					break;
			}
		});
		//要素初期化
		container.children('tr').last().reset();
	});
}
//行削除
jQuery.fn.removerow = function(options){
	var options=$.extend({
		row:null,
		resetoptions:{}
	},options);
	return $(this).each(function(){
		if (options.row!=null)
		{
			//要素チェック
			if ($(this).children('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
			var container=$(this).children('tbody');
			//要素削除
			if (container.children('tr').length!=1)
			{
				//要素値移動
				for (var i=options.row;i<container.children('tr').length-1;i++)
				{
					container.children('tr').eq(i).find('iframe,img,input:not(:file),textarea,select,label,span,table').each(function(){
						var target=$(this);
						var index='';
						if (target.attr('id')!=null)
						{
							index=target.attr('id').replace(/[^0-9]+/g,'');
							if (index.length!=0) index=(parseInt(index)+1).toString();
							switch (target.prop('tagName').toLowerCase())
							{
								case 'iframe':
								case 'img':
									target.attr('src',container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).attr('src'));
									break;
								case 'label':
								case 'span':
									target.text(container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).text());
									break;
								case 'table':
									//テーブル内要素のID指定は考慮しない
									var fromtable=container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index);
									var totable=target;
									var fromelements=null;
									var toelements=null;
									totable.html(fromtable.html());
									fromelements=fromtable.find('iframe,img,input:not(:file),textarea,select,label,span');
									toelements=totable.find('iframe,img,input:not(:file),textarea,select,label,span');
									$.each(fromelements,function(index){
										var target=$(this);
										switch (target.prop('tagName').toLowerCase())
										{
											case 'iframe':
											case 'img':
												toelements.eq(index).attr('src',fromelements.eq(index).attr('src'));
												break;
											case 'label':
											case 'span':
												toelements.eq(index).text(fromelements.eq(index).text());
												break;
											default:
												toelements.eq(index).val(fromelements.eq(index).val());
												break;
										}
									});
									break;
								default:
									target.val(container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).val());
									break;
							}
						}
					});
				}
				container.children('tr').last().remove();
			}
			else container.children('tr').reset(options.resetoptions);
		}
	});
}
//行移動
jQuery.fn.moverow = function(options){
	var options=$.extend({
		row:null,
		direction:'up'
	},options);
	return $(this).each(function(){
		if (options.row!=null)
		{
			//要素チェック
			if ($(this).children('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
			var container=$(this).children('tbody');
			var movefrom=container.children('tr').eq(options.row).clone(true);
			var moveto=(options.direction=='up')?-1:1;
			//要素移動
			if (container.children('tr').length!=1)
			{
				//要素値移動
				container.children('tr').eq(options.row).find('iframe,img,input:not(:file),textarea,select,label,span').each(function(){
					var target=$(this);
					var index='';
					if (target.attr('id')!=null)
					{
						index=target.attr('id').replace(/[^0-9]+/g,'');
						if (index.length!=0) index=(parseInt(index)+moveto).toString();
						switch (target.prop('tagName').toLowerCase())
						{
							case 'iframe':
							case 'img':
								target.attr('src',container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).attr('src'));
								break;
							case 'label':
							case 'span':
								target.text(container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).text());
								break;
							default:
								target.val(container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).val());
								break;
						}
					}
				});
				container.children('tr').eq(options.row+moveto).find('iframe,img,input:not(:file),textarea,select,label,span').each(function(){
					var target=$(this);
					var index='';
					if (target.attr('id')!=null)
					{
						index=target.attr('id').replace(/[^0-9]+/g,'');
						if (index.length!=0) index=(parseInt(index)-moveto).toString();
						switch (target.prop('tagName').toLowerCase())
						{
							case 'iframe':
							case 'img':
								target.attr('src',movefrom.find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).attr('src'));
								break;
							case 'label':
							case 'span':
								target.text(movefrom.find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).text());
								break;
							default:
								target.val(movefrom.find(target.prop('tagName').toLowerCase()+'#'+target.attr('id').replace(/[0-9]+/g,'')+index).val());
								break;
						}
					}
				});
			}
		}
	});
}
/*
*--------------------------------------------------------------------
* 編集型テーブル
* -------------------------------------------------------------------
*/
jQuery.fn.editortable = function(options){
	var options=$.extend({
		initialimage:'',
		delete:{
			button:'',
			silent:false,
			resetoptions:{},
			callback:null,
			aftercallback:null
		},
		callback:null
	},options);
	return $(this).each(function(){
		var table=$(this);
		//要素チェック
		if (table.children('tbody')==null)
		{
			alert('tableにはtbody要素を追加して下さい。');
			return;
		}
		if (options.delete.button.length!=0)
			table.on('click',options.delete.button,function(){
				if (!options.delete.silent) if (!confirm('削除します。\nよろしいですか？')) return;
				var my=$(this).closest('table');
				var row=$(this).closest('tr');
				var rows=my.children('tbody').children('tr');
				if (options.delete.callback!=null) options.delete.callback(row);
				my.removerow({row:rows.index(row),resetoptions:options.resetoptions});
				if (options.delete.aftercallback!=null) options.delete.aftercallback();
				if (!my.children('tbody').children('tr').last().isEmpty()) my.addrow(options);
				if (options.callback!=null) options.callback(my.children('tbody').children('tr').last());
			});
		table.on('keyup','input,select,textarea',function(){
			var my=$(this).closest('table');
			var rows=my.children('tbody');
			if (!rows.children('tr').last().isEmpty())
			{
				my.addrow(options);
				if (options.callback!=null) options.callback(my.children('tbody').children('tr').last());
				return false;
			}
		});
		table.on('change','select',function(){
			var my=$(this).closest('table');
			var rows=my.children('tbody');
			if (!rows.children('tr').last().isEmpty())
			{
				my.addrow(options);
				if (options.callback!=null) options.callback(my.children('tbody').children('tr').last());
				return false;
			}
		});
	});
}
/*
*--------------------------------------------------------------------
* 空行判定
*--------------------------------------------------------------------
*/
jQuery.fn.isEmpty = function(){
	var exists=false;
	$(this).find('input,select,textarea').each(function(){
		switch ($(this).prop('tagName').toLowerCase())
		{
			case 'input':
				switch ($(this).prop('type'))
				{
					case 'text':
					case 'number':
					case 'password':
						if (!exists) exists=($(this).val().length!=0);
						break;
				}
				break;
			case 'textarea':
				if (!exists) exists=($(this).val().length!=0);
				break;
			case 'select':
				if (!exists) exists=($(this).find('option').index($(this).find('option:selected'))!=0);
				break;
		}
	});
	$(this).find('textarea').each(function(){
		if (!exists) exists=($(this).val().length!=0);
	});
	return !exists;
}
/*
*--------------------------------------------------------------------
* データ取得(全データ)
*--------------------------------------------------------------------
* parameters
* options @ url     :データ取得先
*         @ append  :新規明細行追加判定
*         @ reset   :取得後のデータ初期化判定
*         @ message :取得失敗時のメッセージ
*         @ silent  :ローディング表示判定
*         @ callback:コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.loaddatas = function(options){
	var options=$.extend({
		url:'',
		append:true,
		reset:true,
		detailreset:true,
		message:'',
		silent:false,
		initialimage:'',
		callback:null,
		messagecallback:null
	},options);
	var form=$(this);
	var errors=(options.message.length!=0)?options.message:'データの取得に失敗しました。';
	//ローディング表示
	if (!options.silent)
		if ($('div#loading')!=null) $('div#loading').css('display','block');
	//データ取得実行
	$.ajax({
		url:options.url,
		type:'get',
		dataType:'json'
	})
	.done(function(json){
		var existsconditions=('conditions' in json)?json.conditions.length:0;
		var existshead=('head' in json)?json.head.length:0;
		var existsdetail=('detail' in json)?json.detail.length:0;
		if (existsconditions+existshead+existsdetail==0)
			if (options.message.length!=0)
			{
				if (options.messagecallback!=null) options.messagecallback('エラー',errors);
				else alert(errors);
				//ローディング消去
				if ($('div#loading')!=null) $('div#loading').css('display','none');
				return;
			}
		//条件データ
		if (existsconditions!=0)
		{
			//全データ初期化
			if (options.reset) form.reset();
			//データセット
			form.attach(json.conditions,'');
		}
		//ヘッダーデータ
		if (existshead!=0)
		{
			//全データ初期化
			if (options.reset) form.reset();
			//データセット
			form.attach(json.head,'');
		}
		//明細初期化用変数
		var inits=new Array();
		//明細データ
		if (existsdetail!=0)
			$.each(json.detail,function(key,values){
				if (key.length!=0)
				{
					if (form.find('table#'+key)!=null)
					{
						var container=form.find('table#'+key);
						//明細初期化
						if (options.detailreset && $.inArray(key,inits)<0)
						{
							container.children('tbody').children('tr').each(function(index){
								if (index==0) $(this).reset();
								else $(this).remove();
							});
							inits.push(key);
						}
						//データセット
						if (values.length!=0)
						{
							var counter='0';
							if (!options.detailreset)
							{
								container.children('tbody').children('tr').last().find('img,input,textarea,select,label,span').each(function(){
									var target=$(this);
									if (target.attr('id')!=null)
									{
										counter=target.attr('id').replace(/[^0-9]+/g,'');
										if (counter!='') return;
									}
								});
								if (counter=='')
								{
									alert('detailreset設定時にはid属性を付与して下さい。');
									return;
								}
								if (!options.append) counter=(parseInt(counter)-1).toString();
							}
							for (var i=0;i<values.length;i++)
							{
								if (options.append) container.addrow({initialimage:options.initialimage});
								container.attach(values[i],(i+parseInt(counter)+1).toString());
								if (!options.append && i<values.length-1) container.addrow({initialimage:options.initialimage});
							}
						}
					}
					else
					{
						if (options.messagecallback!=null) options.messagecallback('エラー','グリッドのIDを確認して下さい。');
						else alert('グリッドのIDを確認して下さい。');
					}
				}
			});
		//入力されている値が空のテキストボックスはtitle内容を初期表示にする
		form.find('input[type=text],input[type=number],textarea').each(function(){
			if ($(this).val().length==0) $(this).val($.data(this,'display'));
		});
		if (options.callback!=null) options.callback(json);
		/* カンマ区切り */
		if ($.isArray($.data(form[0],'comma')))
			$.each($.data(form[0],'comma'),function(index){
				$($.data(form[0],'comma')[index]).toComma();
			});
		/* 日付フォーマット */
		if ($.isArray($.data(form[0],'date')))
			$.each($.data(form[0],'date'),function(index){
				$($.data(form[0],'date')[index]).toDate();
			});
		//ローディング消去
		if (!options.silent)
			if ($('div#loading')!=null) $('div#loading').css('display','none');
	})
	.fail(function(){
		if (options.messagecallback!=null) options.messagecallback('エラー',errors);
		else alert(errors);
		//ローディング消去
		if ($('div#loading')!=null) $('div#loading').css('display','none');
	});
}
jQuery.fn.attach = function(json,index){
	return $(this).each(function(){
		var container=$(this);
		$.each(json,function(key,value){
			//各項目に値設定
			var id=key+index;
			var data=(value==null)?'':value;
			if (container.find('a#'+id).size()) container.find('a#'+id).prop('href',data);
			if (container.find('input[type=text]#'+id).size()) container.find('input[type=text]#'+id).val(data);
			if (container.find('input[type=number]#'+id).size()) container.find('input[type=number]#'+id).val(data);
			if (container.find('input[type=password]#'+id).size()) container.find('input[type=password]#'+id).val(data);
			if (container.find('input[type=checkbox]#'+id).size()) container.find('input[type=checkbox]#'+id).prop('checked',(data=='1')?true:false);
			if (container.find('input[type=radio][id^='+id+']').size())
			{
				var checked=data;
				container.find('input[type=radio][id^='+id+']').each(function(){
					if ($(this).val()==checked) $(this).prop('checked','checked');
				});
			}
			if (container.find('input[type=hidden]#'+id).size()) container.find('input[type=hidden]#'+id).val(data);
			if (container.find('textarea#'+id).size()) container.find('textarea#'+id).val(data);
			if (container.find('select#'+id).size())
			{
				var target=container.find('select#'+id);
				if ($.data(target[0],'options')!=null)
				{
					//親指定がある場合は再読込
					if ($.data(target[0],'options').parent.length!=0) target.loaditems(json[$.data(target[0],'options').parent.replace(/^[^0-9]+\#/g,'')],data);
					else
					{
						if (target.children('option').length==0) target.loaditems('',data);
						else target.val(data);
					}
				}
				else target.val(data);
			}
			if (container.find('label#'+id).size()) container.find('label#'+id).html(data.replace(/\r?\n/g,'<br>'));
			if (container.find('span#'+id).size()) container.find('span#'+id).html(data.replace(/\r?\n/g,'<br>'));
		});
	});
}
/*
*--------------------------------------------------------------------
* データ取得(リスト)
*--------------------------------------------------------------------
* parameters
* param:データ取得先への動的追加パラメータ
* value:データ取得後の設定値
* -------------------------------------------------------------------
*/
jQuery.fn.loaditems = function(param,value,callback){
	return $(this).each(function(){
		//要素チェック
		if ($(this).prop('tagName').toLowerCase()!='select') {alert('loaditemsはselect要素を指定して下さい。');return;}
		var target=$(this);
		if ($.data(target[0],'options')!=null)
		{
			if ($.data(target[0],'options').url.length==0) return;
			//データ取得実行
			$.ajax({
				url:$.data(target[0],'options').url+param,
				type:'get',
				dataType:'json'
			})
			.done(function(json){
				//項目設定
				var option='';
				if ($.data(target[0],'options').top.pattern=='always' && $.data(target[0],'options').top.value.length!=0)
					option+='<option value="'+$.data(target[0],'options').top.value+'">'+$.data(target[0],'options').top.label+'</option>';
				if ('detail' in json)
					$.each(json.detail,function(key,values){
						for (var i=0;i<values.length;i++)
							option+='<option value="'+values[i][$.data(target[0],'options').item.value]+'">'+values[i][$.data(target[0],'options').item.label]+'</option>';
					});
				if (option.length==0)
					if ($.data(target[0],'options').top.pattern=='nodata' && $.data(target[0],'options').top.value.length!=0)
						option+='<option value="'+$.data(target[0],'options').top.value+'">'+$.data(target[0],'options').top.label+'</option>';
				target.html(option);
				//値設定
				if (option.length!=0)
				{
					if (value.length!=0) target.val(value);
					else target.val(target.children('option').first().val());
				}
				if (callback!=null) callback(target);
			})
			.fail(function(){alert('リストデータの取得に失敗しました。');});
		}
	});
}
/*
*--------------------------------------------------------------------
* データ取得(ページ送り)
* -------------------------------------------------------------------
*/
jQuery.fn.loadpager = function(){
	return $(this).each(function(){
		//要素チェック
		if ($(this).prop('tagName').toLowerCase()!='ul') {alert('loadpagerはul要素を指定して下さい。');return;}
		var target=$(this);
		if ($.data(target[0],'options')!=null)
		{
			//項目初期化
			target.children().remove();
			//データ取得実行
			$.ajax({
				url:$.data(target[0],'options').url,
				type:'get',
				dataType:'json'
			})
			.done(function(json){
				if ('pager' in json)
				{
					//1ページのみは処理しない
					if (json.pager.length==1) return;
					$.each(json.pager,function(index,values){
						//要素生成
						var pager=$('<li>').html(values.index);
						var style={'background-color':$.data(target[0],'options').linkback,'color':$.data(target[0],'options').linkfore};
						if (values.current!='0') $.extend(style,{'cursor':'pointer'});
						else style={'background-color':$.data(target[0],'options').activeback,'color':$.data(target[0],'options').activefore};
						pager.css(style);
						target.append(pager);
						//イベント追加
						if ($.data(target[0],'options').callback!=null)
						{
							pager.on('click',function(){$.data(target[0],'options').callback($(this));});
						}
					});
				}
			})
			.fail(function(){alert('ページ送りデータの取得に失敗しました。');});
		}
	});
}
/*
*--------------------------------------------------------------------
* データ取得(個別)
*--------------------------------------------------------------------
* parameters
* options @ url     :データ取得先
*         @ message :取得失敗時のメッセージ
*         @ callback:コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.loadparts = function(options){
	var options=$.extend({
		url:'',
		message:'',
		callback:null,
		messagecallback:null
	},options);
	var target=$(this);
	var errors=(options.message.length!=0)?options.message:'データの取得に失敗しました。';
	//データ取得実行
	$.ajax({
		url:options.url,
		type:'get',
		dataType:'json'
	})
	.done(function(json){
		var existsconditions=('conditions' in json)?json.conditions.length:0;
		var existshead=('head' in json)?json.head.length:0;
		var existsdetail=('detail' in json)?json.detail.length:0;
		if (existsconditions+existshead+existsdetail==0) if (options.message.length!=0)
		{
			if (options.messagecallback!=null) options.messagecallback('エラー',errors);
			else alert(errors);
			return;
		}
		if (options.callback!=null) options.callback(json);
	})
	.fail(function(){
		if (options.messagecallback!=null) options.messagecallback('エラー',errors);
		else alert(errors);
	});
}
/*
*--------------------------------------------------------------------
* リセット操作(form内の全ての入力要素をクリア)
*--------------------------------------------------------------------
* parameters
* options @ images  :初期化時の画像
*         @ callback:コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.reset = function(options){
	var options=$.extend({
		images:{},
		callback:null
	},options);
	var container=$(this);
	switch (container.prop('tagName').toLowerCase())
	{
		case 'table':
			//テーブル初期化
			container.children('tbody').children('tr').each(function(index){
				if (index==0) $(this).reset({images:options.images});
				else $(this).remove();
			});
			if (options.callback!=null) options.callback($(this));
			break;
		default:
			$.each(options.images,function(key,values){$(key,container).attr('src',values);});
			$(this).find('input[type=file]').each(function(){$(this).val('');});
			$(this).find('input[type=text]').each(function(){$(this).val('');});
			$(this).find('input[type=number]').each(function(){$(this).val('');});
			$(this).find('input[type=password]').each(function(){$(this).val('');});
			$(this).find('input[type=hidden]').each(function(){$(this).val('');});
			$(this).find('input[type=checkbox]').each(function(){$(this).prop('checked',false);});
			$(this).find('label').each(function(){
				if ($(this).attr('id')!=null) $(this).text('');
			});
			$(this).find('span').each(function(){
				if ($(this).attr('id')!=null) $(this).text('');
			});
			$(this).find('select').each(function(){
				if ($.data(this,'options')!=null)
				{
					//動的コンボボックスは項目を初期化
					if ($.data(this,'options').parent.length!=0)
					{
						var option='';
						if ($.data(this,'options').top.value.length!=0)
							option='<option value="'+$.data(this,'options').top.value+'">'+$.data(this,'options').top.label+'</option>';
						$(this).html(option);
					}
				}
				if ($(this).children('option').length!=0) $(this).val($(this).children('option').first().val());
			});
			$(this).find('textarea').each(function(){$(this).val('');});
			//入力されている値が空のテキストボックスはtitle内容を初期表示にする
			$(this).find('input[type=text],input[type=number],textarea').each(function(){
				if ($(this).val().length==0) $(this).val($.data(this,'display'));
			});
			//要素内テーブル初期化
			$(this).find('table').each(function(index){
				$(this).children('tbody').children('tr').each(function(index){
					if (index==0) $(this).reset({images:options.images});
					else $(this).remove();
				});
			});
			if (options.callback!=null) options.callback($(this));
			break;
	}
}
/*
*--------------------------------------------------------------------
* フォームデータ送信(全て)
*--------------------------------------------------------------------
* parameters
* options @ message :操作完了時のメッセージ
*         @ silent  :確認メッセージ表示判定
*         @ callback:コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.senddatas = function(options){
	var options=$.extend({
		message:'',
		silent:false,
		empty:true,
		iscontinue:false,
		callback:null,
		messagecallback:null,
		showdetailerror:false
	},options);
	var form=$(this);
	//確認ダイアログ表示
	if (!options.silent)
		if (!confirm('入力したデータを送信します。\n宜しいですか?\n\n内容を確認したい場合は、キャンセルを押して下さい。')) return false;
	//ローディング表示
	if ($('div#loading')!=null) $('div#loading').css('display','block');
	//入力されている値がtitle内容と同一のテキストボックスは初期化
	form.find('input[type=text],input[type=number],textarea').each(function(){
		if ($(this).val()==$.data(this,'display')) $(this).val('');
	});
	//チェックボックスと同一idのhidden要素があるチェックボックスはその値をhidden要素に格納)
	form.find('input[type=checkbox]').each(function(){
		var _checkbox=$(this);
		$(this).closest('form').find('input[type=hidden]#'+$(this).attr('id')).each(function(){
			$(this).val((_checkbox.prop('checked'))?'1':'0');
		});
	});
	/* カンマ区切り解除 */
	if ($.isArray($.data(form[0],'comma')))
		$.each($.data(form[0],'comma'),function(index){
			$.each($($.data(form[0],'comma')[index]),function(){
				$(this).val($(this).toVal().replace(/,/g,''));
			});
		});
	//明細行がある場合は行数を追加
	form.find('table').each(function(){
		if ($(this).attr('id')!=null)
		{
			var containerID=$(this).attr('id');
			//要素チェック
			if ($(this).children('tbody')==null)
			{
				alert('tableにはtbody要素を追加して下さい。');
				//ローディング消去
				if ($('div#loading')!=null) $('div#loading').css('display','none');
				return;
			}
			var container=$(this).children('tbody');
			//行数取得
			var rows=container.children('tr').length;
			//明細行をチェックし、空行なら登録対象から外す
			if (options.empty) $.each(container.children('tr'),function(index){if ($(this).isEmpty()) rows--;});
			//行数設定
			if ($(this).find('input[type=hidden][name='+containerID+'rows]').size())
			{
				$(this).find('input[type=hidden][name='+containerID+'rows]').val(rows);
			}
			else $(this).append($('<input>').prop('type','hidden').prop('name',containerID+'rows').val(rows));
		}
	});
	//送信
	$.ajax({
		url:form.prop('action'),
		type:form.prop('method'),
		data:form.serialize(),
		mimeType:form.prop('enctype'),
		dataType:'json',
		timeout:60000
	})
	.done(function(json){
		var error='';
		if ('error' in json) if (json.error.length!=0) error=json.error;
		if (error.length!=0)
		{
			if (options.messagecallback!=null) options.messagecallback('エラー',error);
			else alert(error);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
			return;
		}
		else
		{
			//入力されている値が空のテキストボックスはtitle内容を初期表示にする
			form.find('input[type=text],input[type=number],textarea').each(function(){
				if ($(this).val().length==0) $(this).val($.data(this,'display'));
			});
			if (options.message.length!=0)
			{
				if (options.messagecallback!=null) options.messagecallback('メッセージ',options.message);
				else alert(options.message);
			}
			if (options.callback!=null) options.callback(json);
		}
		//ローディング消去
		if (!options.iscontinue)
			if ($('div#loading')!=null) $('div#loading').css('display','none');
	})
	.fail(function(XMLHttpRequest,textStatus,errorThrown){
		var errormessage='データ送信に失敗しました。';
		if (options.showdetailerror)
		{
			errormessage='';
			errormessage+='【XMLHttpRequest】'+XMLHttpRequest.status+' ';
			errormessage+='【textStatus】'+textStatus+' ';
			errormessage+='【errorThrown】'+errorThrown.message;
		}
		if (options.messagecallback!=null) options.messagecallback('エラー',errormessage);
		else alert(errormessage);
		//ローディング消去
		if ($('div#loading')!=null) $('div#loading').css('display','none');
	});
}
/*
*--------------------------------------------------------------------
* フォームデータ送信(個別)
*--------------------------------------------------------------------
* parameters
* options @ url     :データ送信先
*         @ values  :データ送信要素
*         @ callback:コールバック関数
* -------------------------------------------------------------------
*/
jQuery.fn.sendparts = function(options){
	var options=$.extend({
		url:'',
		values:{},
		callback:null,
		messagecallback:null,
		showdetailerror:false
	},options);
	var filedata = null;
	try
	{
		//データセット
		filedata = new FormData();
		$.each(options.values,function(key,values){filedata.append(key,values);});
		//送信
		$.ajax({
			url:options.url,
			type:'post',
			data:filedata,
			mimeType:$(this).prop('enctype'),
			processData:false,
			contentType:false,
			dataType:'json',
			timeout:60000
		})
		.done(function(json){
			var error='';
			if ('error' in json) if (json.error.length!=0) error=json.error;
			if (error.length!=0)
			{
				if (options.messagecallback!=null) options.messagecallback('エラー',error);
				else alert(error);
			}
			else
			{
				if (options.callback!=null) options.callback(json);
			}
		})
		.fail(function(XMLHttpRequest,textStatus,errorThrown){
			var errormessage='データ送信に失敗しました。';
			if (options.showdetailerror)
			{
				errormessage='';
				errormessage+='【XMLHttpRequest】'+XMLHttpRequest.status+' ';
				errormessage+='【textStatus】'+textStatus+' ';
				errormessage+='【errorThrown】'+errorThrown.message;
			}
			if (options.messagecallback!=null) options.messagecallback('エラー',errormessage);
			else alert(errormessage);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		});
	}
	catch(e)
	{
		//データセット
		filedata = {};
		$.each(options.values,function(key,values){filedata[key]=values;});
		//送信
		$.ajax({
			url:options.url,
			type:'post',
			data:filedata,
			mimeType:$(this).prop('enctype'),
			dataType:'json',
			timeout:60000
		})
		.done(function(json){
			var error='';
			if ('error' in json) if (json.error.length!=0) error=json.error;
			if (error.length!=0)
			{
				if (options.messagecallback!=null) options.messagecallback('エラー',error);
				else alert(error);
			}
			else
			{
				if (options.callback!=null) options.callback(json);
			}
		})
		.fail(function(XMLHttpRequest,textStatus,errorThrown){
			var errormessage='データ送信に失敗しました。';
			if (options.showdetailerror)
			{
				errormessage='';
				errormessage+='【XMLHttpRequest】'+XMLHttpRequest.status+' ';
				errormessage+='【textStatus】'+textStatus+' ';
				errormessage+='【errorThrown】'+errorThrown.message;
			}
			if (options.messagecallback!=null) options.messagecallback('エラー',errormessage);
			else alert(errormessage);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		});
	}
}
/*
*--------------------------------------------------------------------
* 色選択リスト
* -------------------------------------------------------------------
*/
jQuery.fn.colorSelector = function(colors){
	return $(this).each(function(){
		var target=$(this);
		var colorlist=null;
		var options=target.find('option').hide();
		var position={x:0,y:0};
		if (colors.length!=options.length)
		{
			alert('色情報と選択リスト要素の数が一致しません。');
			return;
		}
		colorlist=$('<div class="colorlist">').css({
			'background-color':'#F3F3F3',
			'border':'1px solid #DCDCDC',
			'border-radius':'0.25em',
			'box-shadow':'0px 0px 2px rgba(0,0,0,0.5)',
			'height':'600px',
			'left':'50%',
			'margin':'0px',
			'max-height':'calc(100% - 2em)',
			'max-width':'calc(100% - 2em)',
			'overflow-x':'hidden',
			'overflow-y':'scroll',
			'padding':'1px',
			'position':'fixed',
			'top':'50%',
			'z-index':'9999999',
			'width':'600px',
			'-webkit-transform':'translate(-50%,-50%)',
			'-ms-transform':'translate(-50%,-50%)',
			'transform':'translate(-50%,-50%)'
		}).on('touchstart mousedown',function(e){e.stopPropagation();}).hide();
		target.css({'background-color':colors[target.find('option').index(target.find('option:selected'))]})
		.off('touchstart.selector mousedown.selector')
		.on('touchstart.selector mousedown.selector',function(e){
			$('div.colorlist').hide();
			colorlist.show();
			return false;
		});
		for (var i=0;i<colors.length;i++)
		{
			colorlist.append(
				$('<div>').css({
					'background-color':colors[i],
					'display':'inline-block',
					'padding-top':'calc(25% - 4px)',
					'margin':'2px',
					'width':'calc(25% - 4px)'
				})
				.on('touchstart mousedown',function(e){e.stopPropagation();})
				.on('click',function(){
					var index=colorlist.find('div').index($(this));
					target.css({'background-color':colors[index]});
					target.val(options.eq(index).val());
					colorlist.hide();
				})
			);
		}
		$('body').on('touchstart mousedown',function(){colorlist.hide();}).append(colorlist);
	});
}
/*
*--------------------------------------------------------------------
* 日付フォーマット
* -------------------------------------------------------------------
*/
jQuery.fn.toDate = function(){
	return $(this).each(function(){
		switch ($(this).prop('tagName').toLowerCase())
		{
			case 'input':
				var value=$(this).val().replace(/[^0-9]+/g,'');
				if (value.length==8)
					if ($.isNumeric(value)) $(this).val(value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2));
				break;
			case 'label':
			case 'span':
				var value=$(this).text().replace(/[^0-9]+/g,'');
				if (value.length==8)
					if ($.isNumeric(value)) $(this).text(value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2));
				break;
		}
	});
}
/*
*--------------------------------------------------------------------
* 数値フォーマット
*--------------------------------------------------------------------
*/
jQuery.fn.toComma = function(){
	return $(this).each(function(){
		switch ($(this).prop('tagName').toLowerCase())
		{
			case 'input':
				if ($(this).val().length!=0) $(this).val(Number($(this).val().replace(',','')).toLocaleString());
				break;
			case 'label':
			case 'span':
				if ($(this).text().length!=0) $(this).text(Number($(this).text().replace(',','')).toLocaleString());
				break;
		}
	});
}
/*
*--------------------------------------------------------------------
* 時間フォーマット
*--------------------------------------------------------------------
*/
jQuery.fn.toTime = function(){
	return $(this).each(function(){
		var value='';
		switch ($(this).prop('tagName').toLowerCase())
		{
			case 'input':
				if ($(this).val().length!=0) value=String($(this).val()).replace(':','');
				break;
			case 'label':
			case 'span':
				if ($(this).text().length!=0) value=String($(this).text()).replace(':','');
				break;
		}
		if (value.length==0) return;
		if ($.isNumeric(value))
		{
			value=('0000'+value).slice(-4);
			$(this).val(value.substr(0,2)+':'+value.substr(2,2));
		}
		else $(this).val('');
	});
}
/*
*--------------------------------------------------------------------
* 送信値フォーマット
* -------------------------------------------------------------------
*/
jQuery.fn.toVal = function(){
	//個別対応
	switch ($(this).prop('tagName').toLowerCase())
	{
		case 'input':
			//入力されている値がtitle内容と同一のテキストボックスは初期化
			if ($(this).prop('type')=='text' || $(this).prop('type')=='number') if ($(this).val()==$.data(this[0],'display')) $(this).val('');
			break;
		case 'textarea':
			//入力されている値がtitle内容と同一のテキストボックスは初期化
			if ($(this).val()==$.data(this[0],'display')) $(this).val('');
			break;
	}
	return $(this).val();
}
/*
*--------------------------------------------------------------------
* クエリ変換
*--------------------------------------------------------------------
*/
jQuery.fn.toQuery = function(){
	var query='';
	//入力されている値がtitle内容と同一のテキストボックスは初期化
	$(this).find('input[type=text],input[type=number],textarea').each(function(){
		if ($(this).val()==$.data(this,'display')) $(this).val('');
	});
	//クエリ生成
	query=$(this).serialize();
	//エンコーディング解除
	query=query.replace(/%5B/g,'[').replace(/%5D/g,']');
	return query;
}
/*
*--------------------------------------------------------------------
* 相対位置取得
* -------------------------------------------------------------------
*/
jQuery.fn.positionLeft = function(parent){
	var target=$(this);
	var pos=0;
	while (parent[0]!=target.parent()[0])
	{
		pos+=target.position().left;
		pos+=target.parent().scrollLeft();
		target=target.parent();
	}
	pos+=target.position().left;
	pos+=target.parent().scrollLeft();
	return pos;
}
jQuery.fn.positionTop = function(parent){
	var target=$(this);
	var pos=0;
	while (parent[0]!=target.parent()[0])
	{
		pos+=target.position().top;
		pos+=target.parent().scrollTop();
		target=target.parent();
	}
	pos+=target.position().top;
	pos+=target.parent().scrollTop();
	return pos;
}
/*
*--------------------------------------------------------------------
* ボーダー幅取得
* -------------------------------------------------------------------
*/
jQuery.fn.borders = function(){
	var target=$(this);
	var borderleft=parseInt(target.css('border-left-width'));
	var borderright=parseInt(target.css('border-right-width'));
	var bordertop=parseInt(target.css('border-top-width'));
	var borderbottom=parseInt(target.css('border-bottom-width'));
	return {
		left:borderleft,
		right:borderright,
		top:bordertop,
		bottom:borderbottom,
		holizontal:borderleft+borderright,
		vertical:bordertop+borderbottom
	};
}
/*
*--------------------------------------------------------------------
* ファイルデータ取得
* -------------------------------------------------------------------
*/
jQuery.fn.readFile = function(files,callback){
	//ローディング表示
	if ($('div#loading')!=null) $('div#loading').css('display','block');
	try
	{
		if (files.length==0)
		{
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
			return;
		}
		if (!files[0].type.match('image.*'))
		{
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
			return;
		}
		var reader=new FileReader();
		reader.onload=(function(readData){
			if (callback) callback(readData.target.result);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		});
		/* read image */
		reader.readAsDataURL(files[0]);
	}
	catch(e)
	{
		alert('お使いのブラウザでは利用出来ません。');
		//ローディング消去
		if ($('div#loading')!=null) $('div#loading').css('display','none');
	}
}
/*
*--------------------------------------------------------------------
* バイト数取得
* -------------------------------------------------------------------
*/
String.prototype.bytelength = function(){
	var res=0;
	for (var i=0;i<this.length;i++)
	{
		var char=this.charCodeAt(i);
		if ((char>=0x0 && char<0x81) || (char==0xf8f0) || (char>=0xff61 && char<0xffa0) || (char>= 0xf8f1 && char< 0xf8f4)) res+=1;
		else res+=2;
	}
	return res;
}
/*
*--------------------------------------------------------------------
* jQuery関数拡張
* -------------------------------------------------------------------
*/
var oldshow = $.fn.show;
jQuery.fn.show = function()
{
    var ret=oldshow.apply(this, arguments);
	if ($(this).prop('tagName').toLowerCase()=='div')
		if ($(this).hasClass('floating'))
			if (parseInt($(this).css('top'))!=0) $(this).css({'top':'0px'});
    return ret;
};
jQuery.fn.isVisible = function()
{
	if ($(this).size())
		if ($(this).prop('tagName').toLowerCase()=='div')
		{
			if ($(this).hasClass('floating')) return ($(this).is(':visible') && parseInt($(this).css('top'))==0);
			else $(this).is(':visible');
		}
    else return $(this).is(':visible');
};
jQuery.extend({
	calculateTax:function(options){
		var options=$.extend({
			able:0,
			free:0,
			isoutsidetax:true,
			taxround:'round',
			taxrate:0
		},options);
		//課税変数端数処理
		var tax=0;
		if (options.isoutsidetax)
		{
			//外税
			switch (options.taxround)
			{
				case 'floor':
					//切り捨て
					options.able=Math.floor(options.able*(1+options.taxrate));
					tax=Math.floor((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'ceil':
					//切り上げ
					options.able=Math.ceil(options.able*(1+options.taxrate));
					tax=Math.ceil((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'round':
					//四捨五入
					options.able=Math.round(options.able*(1+options.taxrate));
					tax=Math.round((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
			}
		}
		else
		{
			//内税
			switch (options.taxround)
			{
				case 'floor':
					//切り捨て
					options.able=Math.floor(options.able);
					tax=Math.floor((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'ceil':
					//切り上げ
					options.able=Math.ceil(options.able);
					tax=Math.ceil((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'round':
					//四捨五入
					options.able=Math.round(options.able);
					tax=Math.round((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
			}
		}
		/* 非課税値端数処理 */
		switch (options.taxround)
		{
			case 'floor':
				//切り捨て
				options.free=Math.floor(options.free);
				break;
			case 'ceil':
				//切り上げ
				options.free=Math.ceil(options.free);
				break;
			case 'round':
				//四捨五入
				options.free=Math.round(options.free);
				break;
		}
		return {able:options.able,tax:tax,free:options.free}
	}
});
/*
*--------------------------------------------------------------------
* データ参照ウインドウ
*--------------------------------------------------------------------
* parameters
* options @ title     :タイトルバー
*         @ message   :メッセージブロック
*         @ close     :Closeボタン
*         @ ok        :OKボタン
*         @ cancel    :キャンセルボタン
* -------------------------------------------------------------------
*/
jQuery.fn.refererAction = function(options){
	var options=$.extend({
		sources:null,
		multi:false,
		ok:{
			button:'',
			callback:null
		},
		search:{
			button:'',
			callback:null
		},
		lists:{},
		rows:{
			row:'',
			callback:null
		}
	},options);
	return $(this).each(function(){
		//引数チェック
		if (options.multi && options.ok.callback==null) {alert('マルチ選択の場合は、OKコールバックを指定して下さい。');return;}
		//要素チェック
		if ($(this).find('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
		var form=$(this);
		$.each(options.sources,function(index){
			var source=$(this);
			//データ格納変数初期化
			$.data(source[0],'refererdatas',[]);
			//ボタン操作
			if (options.search.button.length!=0)
			{
				$.data(source[0],'search',options.search.button);
				source.on('click',options.search.button,function(){
					if (form[0]!=$.data(source[0],'active')[0]) return;
					if (options.search.callback!=null) options.search.callback(source);
				});
			}
			if (options.ok.button.length!=0)
				source.on('click',options.ok.button,function(){
					if (form[0]!=$.data(source[0],'active')[0]) return;
					if (options.ok.callback!=null) options.ok.callback(source);
				});
			//リスト操作
			if (options.lists.length!=0) source.formAction({lists:options.lists});
			//データ決定時操作
			if (!options.multi)
				source.on('click',options.rows.row,function(){
					if (form[0]!=$.data(source[0],'active')[0]) return;
					//値セット
					var table=$.data(source[0],'table');
					var rowindex=$.data(source[0],'rowindex');
					var refererdatas=$.data(source[0],'refererdatas')[source.find(options.rows.row).index($(this))];
					if (rowindex!=null)
					{
						$.each(refererdatas,function(key,values){
							if (table.find('label#'+key+rowindex.toString())) table.find('label#'+key+rowindex.toString()).text(values);
							if (table.find('input#'+key+rowindex.toString()))
							{
								table.find('input#'+key+rowindex.toString()).each(function(){
									switch ($(this).prop('type'))
									{
										case 'checkbox':
											$(this).prop('checked',(values=='1')?true:false);
											break;
										default:
											$(this).val(values);
											break;
									}
								});
							}
							if (table.find('input[type=radio][id^='+key+rowindex.toString()+']').size())
							{
								var checked=values;
								table.find('input[type=radio][id^='+key+rowindex.toString()+']').each(function(){
									if ($(this).val()==checked) $(this).prop('checked','checked');
								});
							}
						});
						//強制行追加
						$.each(table.find('tbody').find('tr').eq(rowindex-1).find('input[type=text],input[type=number],textarea'),function(){
							$(this).trigger('keyup');
						});
					}
					else
					{
						$.each(refererdatas,function(key,values){
							if (form.find('label#'+key)) form.find('label#'+key).text(values);
							if (form.find('input#'+key))
							{
								form.find('input#'+key).each(function(){
									switch ($(this).prop('type'))
									{
										case 'checkbox':
											$(this).prop('checked',(values=='1')?true:false);
											break;
										default:
											$(this).val(values);
											break;
									}
								});
							}
							if (form.find('input[type=radio][id^='+key+']').size())
							{
								var checked=values;
								form.find('input[type=radio][id^='+key+']').each(function(){
									if ($(this).val()==checked) $(this).prop('checked','checked');
								});
							}
						});
					}
					if (options.rows.callback!=null) options.rows.callback(source,$(this));
					source.parents('div').last().hide();
				});
		});
	});
}
jQuery.fn.refererShow = function(target,table,rowindex,callback,query){
	var form=$(this);
	if (target!=null) $.data(form[0],'active',target);
	if (table!=null) $.data(form[0],'table',table);
	if (rowindex!=null) $.data(form[0],'rowindex',rowindex);
	//クエリ生成
	if (query==null) query='';
	$.each(form.find('input[id^=keys]'),function(){
		var keys=$(this).attr('id').replace('keys','');
		if (!$('input#'+keys,$.data(form[0],'active'))) return;
		query+='&keys['+keys+']='+$('input#'+keys,$.data(form[0],'active')).toVal();
	});
	form.loaddatas({
		url:form.attr('action')+query,
		append:false,
		callback:function(json){
			//データ格納変数初期化
			$.data(form[0],'refererdatas',json.detail[form.attr('id')]);
			//明細表示判定
			if (json.detail[form.attr('id')].length==0) $('table#'+form.attr('id')).hide();
			else $('table#'+form.attr('id')).show();
			if (callback!=null) callback(json);
			form.parents('div').last().show();
		}
	});
}
jQuery.fn.refererShowAndSearch = function(target,table,rowindex){
	var form=$(this);
	if (target!=null) $.data(form[0],'active',target);
	if (table!=null) $.data(form[0],'table',table);
	if (rowindex!=null) $.data(form[0],'rowindex',rowindex);
	if ($.data(form[0],'search').length==0) alert('参照ブロックに検索ボタンがありません。');
	else $($.data(form[0],'search'),form).trigger('click');
}
/*
*--------------------------------------------------------------------
* メッセージウインドウ
*--------------------------------------------------------------------
* parameters
* options @ title     :タイトルバー
*         @ message   :メッセージブロック
*         @ close     :Closeボタン
*         @ ok        :OKボタン
*         @ cancel    :キャンセルボタン
* -------------------------------------------------------------------
*/
jQuery.fn.messageWindow = function(options){
	var options=$.extend({
		title:null,
		message:null,
		close:null,
		ok:null,
		cancel:null,
		extend:null
	},options);
	return $(this).each(function(){
		var target=$(this);
		//引数を変数に代入
		$.data(target[0],'title',options.title);
		$.data(target[0],'message',options.message);
		$.data(target[0],'close',options.close);
		$.data(target[0],'ok',options.ok);
		$.data(target[0],'cancel',options.cancel);
		$.data(target[0],'extend',options.extend);
	});
}
jQuery.fn.messageShow = function(title,message,confirmcallback,okcallback,extend){
	var target=$(this);
	var height=0;
	if ($.data(target[0],'cancel'))
	{
		if (confirmcallback!=null) $.data(target[0],'cancel').show();
		else $.data(target[0],'cancel').hide();
	}
	if ($.data(target[0],'title')) $.data(target[0],'title').html(title);
	if ($.data(target[0],'message')) $.data(target[0],'message').html(message);
	target.show();
	if ($.data(target[0],'close')) height+=$.data(target[0],'close').outerHeight(true);
	if ($.data(target[0],'title')) height+=$.data(target[0],'title').outerHeight(true);
	if ($.data(target[0],'message')) height+=$.data(target[0],'message').outerHeight(true);
	if ($.data(target[0],'ok'))  height+=$.data(target[0],'ok').outerHeight(true);
	height+=parseInt(target.children('div').css('padding-top'));
	height+=parseInt(target.children('div').css('padding-bottom'));
	target.children('div').height(height);
	if ($.data(target[0],'extend'))
	{
		if (extend)
		{
			$.data(target[0],'ok').hide();
			$.data(target[0],'extend').show();
		}
		else
		{
			$.data(target[0],'ok').show();
			$.data(target[0],'extend').hide();
		}
	}
	if ($.data(target[0],'close'))
		$.data(target[0],'close').on('click',function(){
			$.data(target[0],'close').off('click');
			$.data(target[0],'ok').off('click');
	 		target.hide();
	 	});
	if ($.data(target[0],'cancel'))
		$.data(target[0],'cancel').on('click',function(){
			$.data(target[0],'cancel').off('click');
			$.data(target[0],'ok').off('click');
	 		target.hide();
	 	});
	if ($.data(target[0],'ok'))
		$.data(target[0],'ok').on('click',function(){
			$.data(target[0],'ok').off('click');
	 		target.hide();
			if (confirmcallback!=null) confirmcallback();
			if (okcallback!=null) okcallback();
	 	});
}
})(jQuery);
