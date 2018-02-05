/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		isdisplaymap:false,
		ismobile:false,
		centerLocation:null,
		chaselocation:null,
		currentlocation:null,
		currentmarker:null,
		displayinfowindow:null,
		displaypoi:null,
		displaydatespan:null,
		displaymap:null,
		editor:null,
		editorconfirm:null,
		map:null,
		splash:null,
		viewlist:null,
		apps:{},
		config:{},
		fieldinfos:{},
		offset:{},
		styles:{
			show:null,
			hide:[{
				featureType:"poi",
				elementType:"labels",
				stylers:[{visibility:"off"}]
			}]
		},
		markers:[]
	};
	var limit=500;
	var events={
		lists:[
			'app.record.index.show',
			'mobile.app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show',
			'mobile.app.record.detail.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit'
		]
	};
	var functions={
		/* map centering */
		centering:function(){
			if (vars.currentlocation.find('input[type=checkbox]').prop('checked')) vars.map.map.setCenter(vars.map.markers[0].getPosition());
			else vars.map.map.setCenter(new google.maps.LatLng(vars.markers[vars.markers.length-1].lat,vars.markers[vars.markers.length-1].lng));
		},
		/* display map */
		displaymap:function(options){
			var options=$.extend({
				address:'',
				latlng:'',
				callback:null
			},options);
			if (options.address.length!=0)
				kintone.proxy(
					'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURIComponent(options.address),
					'GET',
					{},
					{},
					function(body,status,headers){
						if (status>=200 && status<300){
							var json=JSON.parse(body);
							switch (json.status)
							{
								case 'ZERO_RESULTS':
									break;
								case 'OVER_QUERY_LIMIT':
									alert('リクエストが割り当て量を超えています。');
									break;
								case 'REQUEST_DENIED':
									alert('リクエストが拒否されました。');
									break;
								case 'INVALID_REQUEST':
									alert('クエリが不足しています。');
									break;
								case 'OK':
									var lat=json.results[0].geometry.location.lat
									var lng=json.results[0].geometry.location.lng;
									var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURIComponent(options.address)+'@'+lat+','+lng+'&amp;ie=UTF8&amp;ll='+lat+','+lng+'&amp;z=14&amp;t=m&amp;output=embed';
									if (vars.map!=null)
									{
										vars.map.empty();
										vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
									}
									if (options.callback!=null) options.callback(json);
									break;
							}
						}
					},
					function(error){alert('地図座標取得に失敗しました。\n'+error);}
				);
			if (options.latlng.length!=0)
			{
				var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
				vars.map.empty();
				vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
			}
		},
		/* data load */
		loaddatas:function(condition,callback){
			var filters=((condition==null)?'':condition);
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:vars.config['app'],query:filters+' limit '+limit.toString()+' offset '+vars.offset[vars.config['app']].toString()},function(resp){
				if (vars.apps[vars.config['app']]==null) vars.apps[vars.config['app']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['app']],resp.records);
				vars.offset[vars.config['app']]+=limit;
				if (resp.records.length==limit) functions.loaddatas(condition,callback);
				else
				{
					/* create map */
					var isreload=(vars.map!=null);
					var checkbox=$('<label class="customview-checkbox">');
					var span=$('<span>');
					if (isreload)
					{
						vars.markers=functions.loadmarkers();
						if (callback!=null) callback();
						/* chase mode */
						if (vars.config['chasemode']=='1')
						{
							vars.map.watchlocation({callback:function(latlng){
								if (!vars.isdisplaymap) return;
								if (!vars.chaselocation.find('input[type=checkbox]').prop('checked')) return;
								if (!vars.currentlocation.find('input[type=checkbox]').prop('checked')) return;
								if (vars.map.markers.length==0) return;
								/* setup current location */
								vars.map.markers[0].setPosition(latlng);
								vars.map.map.setCenter(latlng);
							}});
						}
					}
					else
					{
						vars.map=$('body').routemap(vars.config['apikey'],function(){
							/* create map */
							vars.map.map.setOptions({styles:vars.styles.hide});
							vars.markers=functions.loadmarkers();
							/* append elements */
							if (!vars.ismobile)
							{
								if ($('.displaymap').size()) $('.displaymap').remove();
								kintone.app.getHeaderMenuSpaceElement().appendChild(vars.displaymap[0]);
							}
							if (callback!=null) callback();
							/* chase mode */
							if (vars.config['chasemode']=='1')
							{
								vars.map.watchlocation({callback:function(latlng){
									if (!vars.isdisplaymap) return;
									if (!vars.chaselocation.find('input[type=checkbox]').prop('checked')) return;
									if (!vars.currentlocation.find('input[type=checkbox]').prop('checked')) return;
									if (vars.map.markers.length==0) return;
									/* setup current location */
									vars.map.markers[0].setPosition(latlng);
									vars.map.map.setCenter(latlng);
								}});
							}
							google.maps.event.addListener(vars.map.map,'idle',function(){
								vars.centerLocation=vars.map.map.getCenter();
							});
							$(window).on('resize',function(e){
								google.maps.event.trigger(vars.map.map,'resize');
								vars.map.map.setCenter(vars.centerLocation);
							});
						},
						isreload,
						function(results,latlng){
							/* map click */
							if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							vars.currentmarker=new google.maps.Marker({
								map:vars.map.map,
								position:latlng
							});
							vars.editorconfirm.show(function(){
								var address=results.formatted_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}[ ]*/g,'');
								$('.head',vars.editor.container).text('ピン登録');
								$('#'+vars.config['datespan'],vars.editor.contents).find('.label').text('');
								$('#'+vars.config['datespan'],vars.editor.contents).find('.receiver').val('');
								$('#'+vars.config['datespan'],vars.editor.contents).hide();
								$('#'+vars.config['modifier'],vars.editor.contents).find('.label').text('');
								$('#'+vars.config['modifier'],vars.editor.contents).find('.receiver').val('');
								$('#'+vars.config['modifier'],vars.editor.contents).hide();
								$('#'+vars.config['address'],vars.editor.contents).find('.label').hide();
								$('#'+vars.config['address'],vars.editor.contents).find('.receiver').val(address).show();
								$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val('');
								$('#'+vars.config['action'],vars.editor.contents).hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
								vars.editor.show({
									buttons:{
										ok:function(){
											if ($('#'+vars.config['address'],vars.editor.contents).find('.receiver').val().length==0)
											{
												alert($('#'+vars.config['address'],vars.editor.contents).find('.title').text()+'を入力して下さい。');
												return;
											}
											if ($('#'+vars.config['information'],vars.editor.contents).find('.receiver').val().length==0)
											{
												alert($('#'+vars.config['information'],vars.editor.contents).find('.title').text()+'を入力して下さい。');
												return;
											}
											var body={
												app:vars.config['app'],
												record:{}
											};
											body.record[vars.config['address']]={value:$('#'+vars.config['address'],vars.editor.contents).find('.receiver').val().replace(/\r?\n/g,'')};
											body.record[vars.config['lat']]={value:latlng.lat()};
											body.record[vars.config['lng']]={value:latlng.lng()};
											body.record[vars.config['information']]={value:$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val()};
											body.record[vars.config['datespan']]={value:new Date().format('Y-m-d')};
											kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
												var label='';
												label+=$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val();
												label+='<br><a href="https://'+$(location).attr('host')+'/k/'+vars.config['app']+'/show#record='+resp.id+'" target="_blank">詳細画面へ</a>';
												vars.markers.push({
													id:resp.id,
													address:$('#'+vars.config['address'],vars.editor.contents).find('.receiver').val().replace(/\r?\n/g,''),
													colors:vars.config['defaultcolor'],
													fontsize:vars.config['markerfont'],
													label:label,
													lat:latlng.lat(),
													lng:latlng.lng(),
													size:vars.config['markersize'],
													extensionindex:0,
													datespan:new Date().format('Y-m-d'),
													modifier:kintone.getLoginUser(),
													action:'更新'
												});
												functions.reloadmap(function(){vars.map.map.setCenter(latlng)});
											},function(error){
												alert(error.message);
											});
											/* close editor */
											vars.editor.hide();
										},
										cancel:function(){
											/* close editor */
											vars.editor.hide();
										}
									}
								});
							},
							function(){
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							});
						},
						function(target){
							var index=0;
							for (var i=0;i<vars.markers.length;i++) if (vars.markers[i].id==target) index=i;
							/* marker click */
							if (!('id' in vars.markers[index])) return;
							var center=vars.map.map.getCenter();
							var latlng=vars.markers[index].lat+','+vars.markers[index].lng;
							var zoom=(($(window).width()>1024)?14:21-Math.ceil($(window).width()/250));
							var link='https://www.google.co.jp/maps?q='+latlng+'&z='+zoom.toString();
							$('.head',vars.editor.container).text('ピン情報');
							$('#'+vars.config['datespan'],vars.editor.contents).find('.label').text(vars.markers[index].datespan);
							$('#'+vars.config['datespan'],vars.editor.contents).find('.receiver').val(vars.markers[index].datespan);
							$('#'+vars.config['datespan'],vars.editor.contents).show();
							$('#'+vars.config['modifier'],vars.editor.contents).find('.label').text(vars.markers[index].modifier.name);
							$('#'+vars.config['modifier'],vars.editor.contents).find('.receiver').val(vars.markers[index].modifier.code);
							$('#'+vars.config['modifier'],vars.editor.contents).show();
							$('#'+vars.config['address'],vars.editor.contents).find('.label').html('<a href="'+link+'" target="_blank">'+vars.markers[index].address+'</a>').show();
							$('#'+vars.config['address'],vars.editor.contents).find('.receiver').hide();
							$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val(vars.markers[index].label.replace(/<br>.*$/g,''));
							$('#'+vars.markers[index].action,$('#'+vars.config['action'])).prop('checked',true);
							$('#'+vars.config['action'],vars.editor.contents).show();
							vars.editor.show({
								buttons:{
									ok:function(){
										var action=$('[name='+vars.config['action']+']:checked',vars.editor.contents).val();
										if (!confirm(action+'します。\nよろしいですか？')) return;
										switch (action)
										{
											case '更新':
											case '一時削除':
												if ($('#'+vars.config['information'],vars.editor.contents).find('.receiver').val().length==0)
												{
													alert($('#'+vars.config['information'],vars.editor.contents).find('.title').text()+'を入力して下さい。');
													return;
												}
												var body={
													app:vars.config['app'],
													id:vars.markers[index].id,
													record:{}
												};
												body.record[vars.config['information']]={value:$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val()};
												body.record[vars.config['datespan']]={value:new Date().format('Y-m-d')};
												body.record[vars.config['action']]={value:action};
												kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
													if (vars.markers[index].action!=action) vars.markers.splice(index,1);
													else
													{
														vars.markers[index].label='';
														vars.markers[index].label+=$('#'+vars.config['information'],vars.editor.contents).find('.receiver').val();
														vars.markers[index].label+='<br><a href="https://'+$(location).attr('host')+'/k/'+vars.config['app']+'/show#record='+vars.markers[index].id+'" target="_blank">詳細画面へ</a>';
														vars.markers[index].extensionindex=0;
														vars.markers[index].datespan=new Date().format('Y-m-d');
														vars.markers[index].modifier=kintone.getLoginUser();
														vars.markers[index].action=action;
													}
													functions.reloadmap(function(){vars.map.map.setCenter(center)});
												},function(error){
													alert(error.message);
												});
												/* close editor */
												vars.editor.hide();
												break;
											case '削除':
												var body={
													app:vars.config['app'],
													ids:[vars.markers[index].id]
												};
												kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
													vars.markers.splice(index,1);
													functions.reloadmap(function(){vars.map.map.setCenter(center)});
												},function(error){
													alert(error.message);
												});
												/* close editor */
												vars.editor.hide();
												break;
										}
									},
									cancel:function(){
										/* close editor */
										vars.editor.hide();
									}
								}
							});
						});
						if (vars.ismobile)
						{
							checkbox.css({
								'background-color':'#f7f9fa',
								'border':'none',
								'border-radius':'5px',
								'box-sizing':'border-box',
								'cursor':'pointer',
								'display':'inline-block',
								'height':'48px',
								'line-height':'48px',
								'margin':'0px',
								'padding':'0px 10px',
								'vertical-align':'top',
								'width':'100%'
							})
							span.css({
								'color':'#3498db',
								'padding-left':'5px'
							})
						}
						/* create currentlocation checkbox */
						vars.currentlocation=checkbox.clone(true)
						.append($('<input type="checkbox" id="currentlocation">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								if (!$(this).prop('checked')) vars.chaselocation.find('input[type=checkbox]').prop('checked',false);
								/* swtich view of marker */
								functions.reloadmap(function(){
									functions.centering();
								});
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.append(span.clone(true).text('現在地を表示'));
						vars.currentlocation.find('input[type=checkbox]').prop('checked',vars.ismobile);
						/* create chaselocation checkbox */
						vars.chaselocation=checkbox.clone(true).addClass('chaselocation')
						.append($('<input type="checkbox" id="chaselocation">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								if ($(this).prop('checked'))
									if (!vars.currentlocation.find('input[type=checkbox]').prop('checked'))
									{
										vars.currentlocation.find('input[type=checkbox]').prop('checked',true);
										/* swtich view of marker */
										functions.reloadmap(function(){
											vars.map.map.setCenter(vars.map.markers[0].getPosition());
										});
									}
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.append(span.clone(true).text('現在地を追跡（ドライブモード）'));
						if (vars.config['chasemode']!='1') vars.chaselocation.hide();
						/* create displayinfowindow checkbox */
						vars.displayinfowindow=checkbox.clone(true)
						.append($('<input type="checkbox" id="infowindow">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								if ($(this).prop('checked')) vars.map.openinfowindow();
								else vars.map.closeinfowindow();
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.append(span.clone(true).text('情報ウインドウを表示'));
						vars.displayinfowindow.hide();
						/* create displaydatespan checkbox */
						vars.displaydatespan=checkbox.clone(true)
						.append($('<input type="checkbox" id="datespan">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								/* swtich view of marker */
								functions.reloadmap();
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.append(span.clone(true).text('経過日数を表示'));
						if (vars.config["datespan"].length==0) vars.displaydatespan.css({'display':'none'});
						else vars.displaydatespan.find('input[type=checkbox]').prop('checked',true);
						/* create displaypoi checkbox */
						vars.displaypoi=checkbox.clone(true)
						.append($('<input type="checkbox" id="poi">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								/* swtich view of poi */
								if ($(this).prop('checked')) vars.map.map.setOptions({styles:vars.styles.show});
								else vars.map.map.setOptions({styles:vars.styles.hide});
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.append(span.clone(true).text('施設を表示'));
						/* create display map button */
						vars.displaymap=$('<button class="kintoneplugin-button-dialog-ok displaymap">')
						.text('地図を表示')
						.on('click',function(e){
							functions.reloadmap(function(){
								vars.isdisplaymap=true;
								functions.centering();
							});
						});
						vars.map.buttonblock
						.prepend(
							$('<button class="customview-menu">')
							.append(
								$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/menu.svg" alt="メニュー" title="メニュー" />')
								.css({'width':'100%'})
								)
							.on('click',function(){
								if (vars.ismobile) $('div.customview-navi').show();
								else $('div.customview-navi').addClass('show');
								/* swtich view of editorconfirm */
								vars.editorconfirm.hide();
								if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
							})
						)
						.prepend(
							$('<div class="customview-navi">')
							.append(
								$('<div class="customview-navicontainer">')
								.append(
										$('<button class="customview-menuclose">')
										.append(
											$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.svg" alt="閉じる" title="閉じる" />')
											.css({'height':'100%'})
											.on('click',function(){
												if (vars.ismobile) $('div.customview-navi').hide();
												else $('div.customview-navi').removeClass('show');
												/* swtich view of editorconfirm */
												vars.editorconfirm.hide();
												if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
											})
										)
								)
								.append(
										$('<div class="customview-navicontents">')
										.prepend(vars.displaypoi)
										.prepend(vars.displaydatespan)
										.prepend(vars.displayinfowindow)
										.prepend(vars.chaselocation)
										.prepend(vars.currentlocation)
								)
							)
						)
						.find('#mapclose').on('click',function(){
							vars.isdisplaymap=false;
							vars.editorconfirm.hide();
							if (vars.currentmarker!=null) vars.currentmarker.setMap(null);
						});
						if (vars.ismobile)
						{
							$('button.customview-menu').css({
								'background-color':'transparent',
								'border':'none',
								'box-sizing':'border-box',
								'cursor':'pointer',
								'display':'inline-block',
								'margin-right':'8px',
								'padding':'0px',
								'height':'48px',
								'vertical-align':'top',
								'width':'48px'
							});
							$('button.customview-menuclose').css({
								'background-color':'transparent',
								'border':'none',
								'box-sizing':'border-box',
								'height':'30px',
								'margin':'0px',
								'padding':'0px',
								'position':'absolute',
								'right':'5px',
								'top':'5px',
								'width':'30px',
								'z-index':'2'
							})
							$('div.customview-navi').css({
								'background-color':'rgba(0,0,0,0.5)',
								'box-sizing':'border-box',
								'display':'none',
								'height':'100%',
								'left':'0px',
								'margin':'0px',
								'padding':'0px',
								'position':'fixed',
								'text-align':'left',
								'top':'0px',
								'transition':'all 0.35s linear 0s',
								'vertical-align':'top',
								'width':'100%',
								'z-index':'1000000'
							});
							$('div.customview-navicontainer').css({
								'background-color':'#f7f9fa',
								'border-radius':'5px',
								'bottom':'1em',
								'box-sizing':'border-box',
								'height':'calc(100% - 2em)',
								'left':'1em',
								'margin':'auto',
								'padding':'0.25em',
								'position':'absolute',
								'right':'1em',
								'top':'1em',
								'vertical-align':'top',
								'width':'calc(100% - 2em)'
							});
							$('div.customview-navicontents').css({
								'box-sizing':'border-box',
								'height':'calc(100% - 40px)',
								'margin':'0px',
								'margin-top':'40px',
								'padding':'0px',
								'overflow-x':'hidden',
								'overflow-y':'auto',
								'vertical-align':'top',
								'white-space':'normal',
								'z-index':'1'
							})
							.prepend(vars.viewlist);
						}
						vars.fieldinfos[vars.config['address']].type='ADDRESS';
						vars.fieldinfos[vars.config['datespan']].type='DATESPAN';
						vars.fieldinfos[vars.config['modifier']].type='MODIFIER';
						vars.editor=$('body').fieldsform({
							buttons:{
								ok:{
									text:'登録'
								},
								cancel:{
									text:'キャンセル'
								}
							},
							fields:[
								vars.fieldinfos[vars.config['datespan']],
								vars.fieldinfos[vars.config['modifier']],
								vars.fieldinfos[vars.config['address']],
								vars.fieldinfos[vars.config['information']],
								vars.fieldinfos[vars.config['action']]
							]
						});
						vars.editorconfirm=$('body').fieldsformconfirm();
					}
				}
			},function(error){});
		},
		/* marker load */
		loadmarkers:function(){
			var markers=[];
			for (var i=0;i<vars.apps[vars.config['app']].length;i++)
			{
				var record=vars.apps[vars.config['app']][i];
				var lat=parseFloat('0'+record[vars.config['lat']].value);
				var lng=parseFloat('0'+record[vars.config['lng']].value);
				var label='';
				var datespan='';
				if (lat+lng!=0)
				{
					if (vars.config["datespan"].length!=0)
						if (record[vars.config['datespan']].value!=null)
						{
							var datefrom=new Date(record[vars.config['datespan']].value.dateformat());
							var dateto=new Date();
							var datediff=dateto.getTime()-datefrom.getTime();
							datespan=Math.floor(datediff/(1000*60*60*24)).toString();
						}
					label='';
					label+=(vars.config['information'])?record[vars.config['information']].value:record[vars.config['address']].value;
					label+='<br><a href="https://'+$(location).attr('host')+'/k/'+vars.config['app']+'/show#record='+record['$id'].value+'" target="_blank">詳細画面へ</a>';
					markers.push({
						id:record['$id'].value,
						address:record[vars.config['address']].value,
						colors:vars.config['defaultcolor'],
						fontsize:vars.config['markerfont'],
						label:label,
						lat:lat,
						lng:lng,
						size:vars.config['markersize'],
						extensionindex:datespan,
						datespan:record[vars.config['datespan']].value,
						modifier:record[vars.config['modifier']].value,
						action:(record[vars.config['action']].value)?record[vars.config['action']].value:'更新'
					});
				}
			}
			markers.sort(function(a,b){
				if(new Date(a.datespan.dateformat())<new Date(b.datespan.dateformat())) return -1;
				if(new Date(a.datespan.dateformat())>new Date(b.datespan.dateformat())) return 1;
				if(parseInt(a.id)<parseInt(b.id)) return -1;
				return 1;
			});
			return markers;
		},
		/* swtich view of marker */
		reloadmap:function(callback){
			var iscurrentlocation=vars.currentlocation.find('input[type=checkbox]').prop('checked');
			var isextensionindex=vars.displaydatespan.find('input[type=checkbox]').prop('checked');
			var isopeninfowindow=vars.displayinfowindow.find('input[type=checkbox]').prop('checked');
			var color='';
			var colors=JSON.parse(vars.config['datespancolors']);
			var markers=$.extend(true,[],vars.markers);
			/* setup zindex */
			if (isextensionindex)
			{
				markers.sort(function(a,b){
					if(parseFloat('0'+a.extensionindex)<parseFloat('0'+b.extensionindex)) return -1;
					if(parseFloat('0'+a.extensionindex)>parseFloat('0'+b.extensionindex)) return 1;
					if(parseInt(a.id)<parseInt(b.id)) return -1;
					return 1;
				});
			}
			for (var i=0;i<markers.length;i++)
			{
				color=vars.config['defaultcolor'];
				if (isextensionindex)
				{
					var datespan=markers[i].extensionindex;
					$.each(colors,function(key,values){
						if (parseInt(datespan)>parseInt(key)-1){color=values;}
					});
				}
				markers[i].colors=color;
			}
			if (iscurrentlocation)
			{
				vars.map.currentlocation({callback:function(latlng){
					markers.unshift({
						icon:{
							anchor:new google.maps.Point(11,11),
							origin:new google.maps.Point(0,0),
							size:new google.maps.Size(22,22),
							url:'https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/currentpos.png',
						},
						lat:latlng.lat(),
						lng:latlng.lng(),
						serialnumber:false
					});
					/* display map */
					vars.map.reloadmap({
						markers:markers,
						isextensionindex:isextensionindex,
						isopeninfowindow:isopeninfowindow,
						callback:function(){
							for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(i+1);
							if (callback!==undefined) callback();
						}
					});
				}});
			}
			else
			{
				/* display map */
				vars.map.reloadmap({
					markers:markers,
					isextensionindex:isextensionindex,
					isopeninfowindow:isopeninfowindow,
					callback:function(){
						for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(i+1);
						if (callback!==undefined) callback();
					}
				});
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check device */
		vars.ismobile=!('viewType' in event);
		/* check view type */
		if (vars.ismobile)
		{
			vars.splash=$('<div id="splash">').css({
				'background':'#f3f3f3',
				'height':'100%',
				'left':'0px',
				'position':'fixed',
				'top':'0px',
				'width':'100%',
				'z-index':'2000000'
			});
			vars.splash.append(
				$('<p>')
				.css({
					'display':'block',
					'bottom':'0',
					'height':'2em',
					'left':'0',
					'line-height':'2em',
					'margin':'auto',
					'max-height':'100%',
					'max-width':'100%',
					'overflow':'hidden',
					'padding':'0px',
					'position':'absolute',
					'right':'0',
					'text-align':'center',
					'top':'0',
					'width':'100%'
				})
				.text('now loading')
			);
			$('body').append(vars.splash);
		}
		else
		{
			if (event.viewType.toUpperCase()=='CALENDAR') return event;
		}
		/* initialize valiable */
		vars.markers=[];
		if (vars.map!=null)
		{
			if (vars.config['chasemode']=='1') vars.map.unwatchlocation();
		}
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config['app']},function(resp){
			vars.fieldinfos=resp.properties;
			/* load datas */
			vars.isdisplaymap=false;
			vars.apps[vars.config['app']]=null;
			vars.offset[vars.config['app']]=0;
			if (vars.ismobile)
			{
				kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:vars.config['app']},function(resp){
					var views=[];
					vars.viewlist=$('<select>').css({
						'background-color':'#f7f9fa',
						'border':'1px solid #3498db',
						'border-radius':'5px',
						'box-sizing':'border-box',
						'color':'#3498db',
						'display':'block',
						'height':'48px',
						'line-height':'48px',
						'margin':'0px',
						'margin-bottom':'15px',
						'padding':'0px 10px',
						'vertical-align':'top',
						'width':'100%'
					});
					$.each(resp.views,function(key,values){
					    if (values.type.toUpperCase()=='LIST') views.push(values);
					})
					views.sort(function(a,b){
						if(parseInt(a.index)<parseInt(b.index)) return -1;
						if(parseInt(a.index)>parseInt(b.index)) return 1;
						return 0;
					});
					for (var i=0;i<views.length;i++)
					{
						var sort=(views[i].sort)?views[i].sort:'';
						if (sort.length!=0) sort=' order by '+sort.replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'');
						vars.viewlist.append($('<option>').attr('id',views[i].id).text(views[i].name).val(views[i].filterCond+sort));
					}
					vars.viewlist.on('change',function(){
						if (vars.config['chasemode']=='1') vars.map.unwatchlocation();
						vars.isdisplaymap=false;
						vars.apps[vars.config['app']]=null;
						vars.offset[vars.config['app']]=0;
						functions.loaddatas($(this).val(),function(){
							functions.reloadmap(function(){
								vars.isdisplaymap=true;
								functions.centering();
								$('div.customview-navi').hide();
							});
						});
					});
					if ($('option#'+event.viewId,vars.viewlist).size()) $('option#'+event.viewId,vars.viewlist).attr('selected',true);
					functions.loaddatas(vars.viewlist.val(),function(){
						functions.reloadmap(function(){
							vars.isdisplaymap=true;
							functions.centering();
							if (vars.splash!=null) vars.splash.hide();
						});
					});
				},function(error){if (vars.splash!=null) vars.splash.hide();});
			}
			else functions.loaddatas(kintone.app.getQuery().replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,''));
		},function(error){if (vars.splash!=null) vars.splash.hide();});
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* hide elements  */
		kintone.app.record.setFieldShown(vars.config['lat'],false);
		kintone.app.record.setFieldShown(vars.config['lng'],false);
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		/* the initial display when editing */
		if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record.lat.value+','+event.record.lng.value});
		/* display map in value change event */
		if (event.type.match(/(create|edit)/g)!=null)
		{
			var button=null;
			var input=null;
			var height=0;
			input=$('body').fields(vars.config['address'])[0];
			button=$('<button class="customsearch-button">');
			height=input.outerHeight(false);
			if (height-30>0) button.css({'margin':((height-30)/2).toString()+'px','min-height':'30px','min-width':'30px'});
			else button.css({'background-size':height.toString()+'px '+height.toString()+'px','margin':'0px','min-height':height.toString()+'px','min-width':height.toString()+'px'});
			input.css({'padding-right':height.toString()+'px'})
			.closest('div').append(
				button.on('click',function(){
					var target=$(this).closest('div').find('input');
					functions.displaymap({
						address:target.val(),
						callback:function(json){
							var record=(event.type.match(/mobile/g)!=null)?kintone.mobile.app.record.get():kintone.app.record.get();
							record.record[vars.config['lat']].value=json.results[0].geometry.location.lat;
							record.record[vars.config['lng']].value=json.results[0].geometry.location.lng;
							if (event.type.match(/mobile/g)!=null) kintone.mobile.app.record.set(record);
							else kintone.app.record.set(record);
						}
					});
				})
			);
		}
		kintone.app.record.getSpaceElement(vars.config['spacer']).appendChild(vars.map[0]);
		return event;
	});
	kintone.events.on(events.save,function(event){
		if (parseFloat('0'+event.record[vars.config['lat']].value)+parseFloat('0'+event.record[vars.config['lng']].value)==0)
		{
			return new kintone.Promise(function(resolve,reject){
				kintone.proxy(
					'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURIComponent(event.record[vars.config['address']].value),
					'GET',
					{},
					{},
					function(body,status,headers){
						if (status>=200 && status<300){
							var json=JSON.parse(body);
							switch (json.status)
							{
								case 'ZERO_RESULTS':
								case 'OVER_QUERY_LIMIT':
								case 'REQUEST_DENIED':
								case 'INVALID_REQUEST':
									break;
								case 'OK':
									var lat=json.results[0].geometry.location.lat
									var lng=json.results[0].geometry.location.lng;
									event.record[vars.config['lat']].value=lat;
									event.record[vars.config['lng']].value=lng;
									resolve(event);
									break;
							}
						}
					}
				);
			});
		}
		else return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
