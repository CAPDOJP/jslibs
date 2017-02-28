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
		texts:{}
	},options);
	//キー制御
	$(document).on('keydown','input[type=text],input[type=password],select',function(e){
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var targets=$(this).closest('form').find('button:visible,input[type=text]:visible,input[type=password]:visible,input[type=button]:visible,textarea:visible,select:visible');
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
			var targets=$(this).closest('form').find('button:visible,input[type=text]:visible,input[type=password]:visible,input[type=button]:visible,textarea:visible,select:visible');
			var total=targets.length;
			var index=targets.index(this);
			targets.eq(index+(e.shiftKey?(index>0?-1:0):(index<total?+1:total))).focus();
			return false;
		}
	});
	return $(this).each(function(){
		var form=$(this);
		//テキストボックス操作(title属性があるテキストボックスはtitle内容を初期表示にする)
		form.find('input[type=text],textarea').each(function(){
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
						target.replaceWith(target.clone());
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
						dataType:'json',
						error:function(){
							if (values.messagecallback!=null) values.messagecallback('エラー','データ送信に失敗しました。');
							else alert('データ送信に失敗しました。');
							//値初期化
							target.replaceWith(target.clone());
							//ローディング消去
							if ($('div#loading')!=null) $('div#loading').css('display','none');
						},
						success:function(json){
							//値初期化
							target.replaceWith(target.clone());
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
						}
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
	});
}
//行追加
jQuery.fn.addrow = function(options){
	var options=$.extend({
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
		container.children('tr').last().find('img,input,textarea,select,label,span').each(function(){
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
					container.children('tr').eq(i).find('img,input,textarea,select,label,span,table').each(function(){
						var target=$(this);
						if (target.attr('id')!=null)
						{
							switch (target.prop('tagName').toLowerCase())
							{
								case 'img':
									target.attr('src',container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').attr('src'));
									break;
								case 'label':
								case 'span':
									target.text(container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').text());
									break;
								case 'table':
									//テーブル内要素のID指定は考慮しない
									var fromtable=container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']');
									var totable=target;
									var fromelements=null;
									var toelements=null;
									totable.html(fromtable.html());
									fromelements=fromtable.find('img,input,textarea,select,label,span');
									toelements=totable.find('img,input,textarea,select,label,span');
									$.each(fromelements,function(index){
										var target=$(this);
										switch (target.prop('tagName').toLowerCase())
										{
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
									target.val(container.children('tr').eq(i+1).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').val());
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
				container.children('tr').eq(options.row).find('img,input,textarea,select,label,span').each(function(){
					var target=$(this);
					if (target.attr('id')!=null)
					{
						switch (target.prop('tagName').toLowerCase())
						{
							case 'img':
								target.attr('src',container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').attr('src'));
								break;
							case 'label':
							case 'span':
								target.text(container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').text());
								break;
							default:
								target.val(container.children('tr').eq(options.row+moveto).find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').val());
								break;
						}
					}
				});
				container.children('tr').eq(options.row+moveto).find('img,input,textarea,select,label,span').each(function(){
					var target=$(this);
					if (target.attr('id')!=null)
					{
						switch (target.prop('tagName').toLowerCase())
						{
							case 'img':
								target.attr('src',movefrom.find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').attr('src'));
								break;
							case 'label':
							case 'span':
								target.text(movefrom.find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').text());
								break;
							default:
								target.val(movefrom.find(target.prop('tagName').toLowerCase()+'[id^='+target.attr('id').replace(/[0-9]+/g,'')+']').val());
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
			callback:null
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
				if (!my.children('tbody').children('tr').last().isEmpty()) my.addrow(options);
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
		dataType:'json',
		error:function(){
			if (options.messagecallback!=null) options.messagecallback('エラー',errors);
			else alert(errors);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		},
		success:function(json){
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
				attach(form,json.conditions,'');
			}
			//ヘッダーデータ
			if (existshead!=0)
			{
				//全データ初期化
				if (options.reset) form.reset();
				//データセット
				attach(form,json.head,'');
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
									attach(container,values[i],(i+parseInt(counter)+1).toString());
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
			form.find('input[type=text],textarea').each(function(){
				if ($(this).val().length==0) $(this).val($.data(this,'display'));
			});
			if (options.callback!=null) options.callback(json);
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		}
	});
	function attach(container,json,index)
	{
		$.each(json,function(key,value){
			//各項目に値設定
			var id=key+index;
			var data=(value==null)?'':value;
			if (container.find('a#'+id).size()) container.find('a#'+id).prop('href',data);
			if (container.find('input[type=text]#'+id).size()) container.find('input[type=text]#'+id).val(data);
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
	};
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
				dataType:'json',
				error:function(){alert('リストデータの取得に失敗しました。');},
				success:function(json){
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
				}
			});
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
				dataType:'json',
				error:function(){alert('ページ送りデータの取得に失敗しました。');},
				success:function(json){
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
				}
			});
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
		dataType:'json',
		error:function(){
			if (options.messagecallback!=null) options.messagecallback('エラー',errors);
			else alert(errors);
		},
		success:function(json){
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
		}
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
			$(this).find('input[type=text],textarea').each(function(){
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
		messagecallback:null
	},options);
	var form=$(this);
	//確認ダイアログ表示
	if (!options.silent)
		if (!confirm('入力したデータを送信します。\n宜しいですか?\n\n内容を確認したい場合は、キャンセルを押して下さい。')) return false;
	//ローディング表示
	if ($('div#loading')!=null) $('div#loading').css('display','block');
	//入力されている値がtitle内容と同一のテキストボックスは初期化
	form.find('input[type=text],textarea').each(function(){
		if ($(this).val()==$.data(this,'display')) $(this).val('');
	});
	//チェックボックスと同一idのhidden要素があるチェックボックスはその値をhidden要素に格納)
	form.find('input[type=checkbox]').each(function(){
		var _checkbox=$(this);
		$(this).closest('form').find('input[type=hidden]#'+$(this).attr('id')).each(function(){
			$(this).val((_checkbox.prop('checked'))?'1':'0');
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
			//明細行を最終行からチェックし、空行なら登録対象から外す
			if (options.empty) $(container.children('tr').get().reverse()).each(function(){if ($(this).isEmpty()) rows--;});
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
		timeout:60000,
		error:function(){
			if (options.messagecallback!=null) options.messagecallback('エラー','データ送信に失敗しました。');
			else alert('データ送信に失敗しました。');
			//ローディング消去
			if ($('div#loading')!=null) $('div#loading').css('display','none');
		},
		success:function(json){
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
				form.find('input[type=text],textarea').each(function(){
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
		}
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
		messagecallback:null
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
			timeout:60000,
			error:function(){
				if (options.messagecallback!=null) options.messagecallback('エラー','データ送信に失敗しました。');
				else alert('データ送信に失敗しました。');
			},
			success:function(json){
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
			}
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
			timeout:60000,
			error:function(){
				if (options.messagecallback!=null) options.messagecallback('エラー','データ送信に失敗しました。');
				else alert('データ送信に失敗しました。');
			},
			success:function(json){
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
			}
		});
	}
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
				if ($(this).val().length==8)
					if ($.isNumeric($(this).val())) $(this).val($(this).val().substr(0,4)+'-'+$(this).val().substr(4,2)+'-'+$(this).val().substr(6,2));
				break;
			case 'label':
			case 'span':
				if ($(this).text().length==8)
					if ($.isNumeric($(this).text())) $(this).text($(this).text().substr(0,4)+'-'+$(this).text().substr(4,2)+'-'+$(this).text().substr(6,2));
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
				if ($(this).val().length!=0) $(this).val(String($(this).val()).replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,'));
				break;
			case 'label':
			case 'span':
				if ($(this).text().length!=0) $(this).text(String($(this).text()).replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,'));
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
			if ($(this).prop('type')=='text') if ($(this).val()==$.data(this[0],'display')) $(this).val('');
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
	$(this).find('input[type=text],textarea').each(function(){
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
		//要素チェック
		if ($(this).find('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
		var form=$(this);
		$.each(options.sources,function(index){
			var source=$(this);
			//ボタン操作
			if (options.search.button.length!=0)
				source.on('click',options.search.button,function(){
					if (options.search.callback!=null) options.search.callback(source);
				});
			//リスト操作
			if (options.lists.length!=0) source.formAction({lists:options.lists});
			//データ決定時操作
			source.on('click',options.rows.row,function(){
				//値セット
				var table=$.data(source[0],'table');
				var rowindex=$.data(source[0],'rowindex');
				if (rowindex!=null)
				{
					$(this).find('input[type=hidden]').each(function(){
						if (table.find('label#'+$(this).attr('id').replace(/[0-9]+/g,'')+rowindex.toString()))
							table.find('label#'+$(this).attr('id').replace(/[0-9]+/g,'')+rowindex.toString()).text($(this).toVal());
						if (table.find('input#'+$(this).attr('id').replace(/[0-9]+/g,'')+rowindex.toString()))
							table.find('input#'+$(this).attr('id').replace(/[0-9]+/g,'')+rowindex.toString()).val($(this).toVal());
					});
					//強制行追加
					$.each(table.find('tbody').find('tr').eq(rowindex-1).find('input[type=text],textarea'),function(){
						$(this).trigger('keyup');
					});
				}
				else
				{
					$(this).find('input[type=hidden]').each(function(){
						if (form.find('label#'+$(this).attr('id').replace(/[0-9]+/g,''))) form.find('label#'+$(this).attr('id').replace(/[0-9]+/g,'')).text($(this).toVal());
						if (form.find('input#'+$(this).attr('id').replace(/[0-9]+/g,''))) form.find('input#'+$(this).attr('id').replace(/[0-9]+/g,'')).val($(this).toVal());
					});
				}
				if (options.rows.callback!=null) options.rows.callback(source);
				source.parents('div').last().hide();
			});
		});
	});
}
jQuery.fn.refererShow = function(target,table,rowindex){
	var form=$(this);
	$.data(form[0],'table',table);
	$.data(form[0],'rowindex',rowindex);
	//クエリ生成
	var query='';
	$.each(form.find('input[id^=keys]'),function(){
		var keys=$(this).attr('id').replace('keys','');
		if (!$('input#'+keys,target)) return;
		query+='&keys['+keys+']='+$('input#'+keys,target).toVal();
	});
	form.loaddatas({
		url:form.attr('action')+query,
		append:false,
		callback:function(json){
			//明細表示判定
			if (json.detail[form.attr('id')].length==0) $('table#'+form.attr('id')).hide();
			else $('table#'+form.attr('id')).show();
			form.parents('div').last().show();
		}
	});
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
