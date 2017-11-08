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
		chaselocation:null,
		currentlocation:null,
		displayinfowindow:null,
		displaypoi:null,
		displaydatespan:null,
		displaymap:null,
		editor:null,
		map:null,
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
		/* display map */
		displaymap:function(options){
			var options=$.extend({
				address:'',
				pluscode:'',
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
									vars.map.empty();
									vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
									kintone.proxy(
										'https://plus.codes/api?address='+lat+','+lng+'&ekey='+vars.config['apikey']+'&language=ja',
										'GET',
										{},
										{},
										function(body,status,headers){
											if (status>=200 && status<300){
												switch (json.status)
												{
													case 'ZERO_RESULTS':
													case 'OVER_QUERY_LIMIT':
													case 'REQUEST_DENIED':
													case 'INVALID_REQUEST':
														break;
													case 'OK':
														json.results[0]['global_code']=JSON.parse(body).plus_code.global_code;
														if (options.callback!=null) options.callback(json);
														break;
												}
											}
										},
										function(error){alert('地図座標取得に失敗しました。\n'+error);}
									);
									break;
							}
						}
					},
					function(error){alert('地図座標取得に失敗しました。\n'+error);}
				);
			if (options.pluscode.length!=0)
				kintone.proxy(
					'https://plus.codes/api?address='+encodeURIComponent(options.pluscode)+'&ekey='+vars.config['apikey']+'&language=ja',
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
									var address=json.plus_code.best_street_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}/g,'');
									var lat=json.plus_code.geometry.location.lat;
									var lng=json.plus_code.geometry.location.lng;
									var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURIComponent(address)+'@'+lat+','+lng+'&amp;ie=UTF8&amp;ll='+lat+','+lng+'&amp;z=14&amp;t=m&amp;output=embed';
									vars.map.empty();
									vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
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
			var filters=(condition.length==0)?kintone.app.getQuery():condition;
			if (filters==null) filters='order by $id asc';
			else filters=filters.replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'');
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
								vars.map.refresh();
							}});
						}
					}
					else
					{
						vars.map=$('body').routemap(vars.config['apikey'],true,false,function(){
							/* create map */
							vars.map.map.setOptions({styles:vars.styles.hide});
							vars.markers=functions.loadmarkers();
							/* append elements */
							if (!vars.ismobile)
							{
								kintone.app.getHeaderMenuSpaceElement().innerHTML='';
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
									vars.map.refresh();
								}});
							}
						},
						isreload,
						function(target,latlng){
							/* map click */
							var informationname=vars.fieldinfos[vars.config['information']].label;
							vars.editor.show({
								type:'add',
								placeholder:informationname+'を入力',
								buttons:{
									ok:function(){
										if (vars.editor.text.val().length==0)
										{
											alert(informationname+'を入力して下さい。');
											return;
										}
										kintone.proxy(
											'https://plus.codes/api?address='+latlng.lat()+','+latlng.lng()+'&ekey=AIzaSyC9Ee1Qoi5afjhqNR0YlpjmaBSqXYkORfs&language=ja',
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
															var address=json.plus_code.best_street_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}/g,'');
															var pluscode=json.plus_code.global_code;
															var lat=json.plus_code.geometry.location.lat;
															var lng=json.plus_code.geometry.location.lng;
															var body={
																app:kintone.app.getId(),
																record:{}
															};
															body.record[vars.config['address']]={value:address};
															body.record[vars.config['pluscode']]={value:pluscode};
															body.record[vars.config['lat']]={value:lat};
															body.record[vars.config['lng']]={value:lng};
															body.record[vars.config['information']]={value:vars.editor.text.val()};
															body.record[vars.config['datespan']]={value:new Date().format('Y-m-d')};
															kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
																var label='';
																label+=vars.editor.text.val();
																label+='<br><a href="https://'+$(location).attr('host')+'/k/'+vars.config['app']+'/show#record='+resp.id+'" target="_blank">詳細画面へ</a>';
																vars.markers.push({
																	id:resp.id,
																	colors:vars.config['defaultcolor'],
																	fontsize:vars.config['markerfont'],
																	label:label,
																	lat:lat,
																	lng:lng,
																	size:vars.config['markersize'],
																	extensionindex:0
																});
																functions.reloadmap(function(){vars.map.map.setCenter(latlng);});
															},function(error){
																alert(error.message);
															});
															break;
													}
												}
											}
										);
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
						function(latlng){
							/* marker click */
							var informationname=vars.fieldinfos[vars.config['information']].label;
							var filter=$.grep(vars.markers,function(item,index){
								return (item['lat']==latlng.lat() && item['lng']==latlng.lng())
							});
							if (filter.length==0) return;
							if (!('id' in filter[0])) return;
							vars.editor.text.val(filter[0].label.replace(/<br>.*$/g,''));
							vars.editor.show({
								type:'upd',
								placeholder:informationname+'を入力',
								buttons:{
									ok:function(){
										if (vars.editor.text.val().length==0)
										{
											alert(informationname+'を入力して下さい。');
											return;
										}
										var body={
											app:kintone.app.getId(),
											id:filter[0].id,
											record:{}
										};
										body.record[vars.config['information']]={value:vars.editor.text.val()};
										body.record[vars.config['datespan']]={value:new Date().format('Y-m-d')};
										if ($('input[type=checkbox]',vars.editor.checkbox).prop('checked')) body.record[vars.config['remove']]={value:['一時撤去']};
										kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
											filter[0].label='';
											filter[0].label+=vars.editor.text.val();
											filter[0].label+='<br><a href="https://'+$(location).attr('host')+'/k/'+vars.config['app']+'/show#record='+filter[0].id+'" target="_blank">詳細画面へ</a>';
											functions.reloadmap(function(){vars.map.map.setCenter(latlng);});
										},function(error){
											alert(error.message);
										});
										/* close editor */
										vars.editor.hide();
									},
									del:function(){
										if (!confirm('削除します。\nよろしいですか？')) return;
										var body={
											app:kintone.app.getId(),
											ids:[filter[0].id]
										};
										kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
											vars.markers.splice(vars.markers.indexOf(filter[0]),1);
											functions.reloadmap();
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
								/* swtich view of marker */
								functions.reloadmap();
							})
						)
						.append(span.clone(true).text('現在地を表示'));
						vars.currentlocation.find('input[type=checkbox]').prop('checked',vars.ismobile);
						/* create chaselocation checkbox */
						vars.chaselocation=checkbox.clone(true)
						.append($('<input type="checkbox" id="chaselocation">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
							})
						)
						.append(span.clone(true).text('現在地を追跡'));
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
							})
						)
						.append(span.clone(true).text('情報ウインドウを表示'));
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
							})
						)
						.append(span.clone(true).text('経過日数を表示'));
						if (vars.config["datespan"].length==0) vars.displaydatespan.css({'display':'none'});
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
							})
						)
						.append(span.clone(true).text('施設を表示'));
						/* create display map button */
						vars.displaymap=$('<button class="kintoneplugin-button-dialog-ok">')
						.text('地図を表示')
						.on('click',function(e){
							functions.reloadmap(function(){vars.isdisplaymap=true;});
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
						.find('#mapclose').on('click',function(){vars.isdisplaymap=false;});
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
						vars.editor=$('body').editor({
							buttons:{
								ok:{
									text:'OK'
								},
								del:{
									text:'削除'
								},
								cancel:{
									text:'キャンセル'
								}
							}
						});
					}
				}
			},function(error){});
		},
		/* marker load */
		loadmarkers:function(){
			var markers=[];
			$.each(vars.apps[vars.config['app']],function(index,values){
				var record=values
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
						colors:vars.config['defaultcolor'],
						fontsize:vars.config['markerfont'],
						label:label,
						lat:lat,
						lng:lng,
						size:vars.config['markersize'],
						extensionindex:datespan
					});
				}
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
			if (isextensionindex)
			{
				/* setup zindex */
				markers.sort(function(a,b){
					if(parseFloat('0'+a.extensionindex)>parseFloat('0'+b.extensionindex)) return -1;
					if(parseFloat('0'+a.extensionindex)<parseFloat('0'+b.extensionindex)) return 1;
					return 0;
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
							for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(vars.map.markers.length-i);
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
						if (isextensionindex)
						{
							var latlng=null;
							var olddate=new Date();
							var oldid=Number.MAX_SAFE_INTEGER;
							$.each(vars.apps[vars.config['app']],function(index,values){
								var record=values
								if (record[vars.config['datespan']].value!=null)
								{
									var checkdate=new Date(record[vars.config['datespan']].value.dateformat());
									if (checkdate<olddate)
									{
										olddate=checkdate;
										latlng=new google.maps.LatLng(parseFloat('0'+record[vars.config['lat']].value),parseFloat('0'+record[vars.config['lng']].value));
									}
									if (checkdate.format('Y-m-d')==olddate.format('Y-m-d'))
									{
										if (parseInt(record['$id'].value)<oldid)
										{
											oldid=parseInt(record['$id'].value);
											latlng=new google.maps.LatLng(parseFloat('0'+record[vars.config['lat']].value),parseFloat('0'+record[vars.config['lng']].value));
										}
									}
								}
							});
							if (latlng!=null) vars.map.map.setCenter(latlng);
						}
						for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(vars.map.markers.length-i);
						if (callback!==undefined) callback();
					}
				});
			}
		}
	};
	var EditDialog=function(options){
		var options=$.extend({
			container:null,
			buttons:{
				ok:{
					text:''
				},
				del:{
					text:''
				},
				cancel:{
					text:''
				}
			}
		},options);
		/* property */
		this.buttons=options.buttons;
		/* valiable */
		var my=this;
		/* create elements */
		var div=$('<div>').css({
			'box-sizing':'border-box',
			'margin':'0px',
			'padding':'0px',
			'position':'relative',
			'vertical-align':'top'
		});
		var button=$('<button>').css({
			'background-color':'transparent',
			'border':'none',
			'box-sizing':'border-box',
			'color':'#FFFFFF',
			'cursor':'pointer',
			'font-size':'13px',
			'height':'auto',
			'margin':'0px 3px',
			'min-height':'30px',
			'min-width':'30px',
			'outline':'none',
			'padding':'0px 2em',
			'vertical-align':'top',
			'width':'auto'
		});
		/* append elements */
		this.cover=div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		});
		this.container=div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'left':'0',
			'margin':'auto',
			'max-height':'90%',
			'max-width':'90%',
			'padding':'0px',
			'position':'absolute',
			'right':'0',
			'text-align':'center',
			'top':'0',
			'width':'600px'
		});
		this.contents=div.clone(true).css({
			'height':'auto',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'margin':'0px',
			'padding':'10px',
			'position':'relative',
			'width':'100%',
			'z-index':'1'
		});
		this.buttonblock=div.clone(true).css({
			'background-color':'#3498db',
			'border-bottom-left-radius':'5px',
			'border-bottom-right-radius':'5px',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'2'
		});
		this.text=$('<input type="text">').css({
			'box-sizing':'border-box',
			'height':'45px',
			'line-height':'45px',
			'margin':'0px',
		    'padding':'0px 5px',
			'width':'100%'
		});
		this.checkbox=$('<label>').css({
			'border':'none',
			'box-sizing':'border-box',
			'cursor':'pointer',
			'display':'inline-block',
			'height':'48px',
			'line-height':'48px',
			'margin':'0px',
			'padding':'0px 5px',
			'vertical-align':'top',
			'width':'100%'
		})
		.append($('<input type="checkbox">'))
		.append($('<span>').css({'color':'#3498db','padding-left':'5px'}).text('一時撤去'));
		/* append elements */
		$.each(this.buttons,function(key,values){
			my.buttonblock.append(
				button.clone(true)
				.attr('id',key)
				.text(values.text)
			);
		});
		/* append elements */
		this.contents.append(this.text);
		this.contents.append(this.checkbox);
		this.container.append(this.contents);
		this.container.append(this.buttonblock);
		this.cover.append(this.container);
		options.container.append(this.cover);
	};
	EditDialog.prototype={
		/* display calendar */
		show:function(options){
			var options=$.extend({
				type:'add',
				placeholder:'',
				buttons:{}
			},options);
			var my=this;
			$.each(options.buttons,function(key,values){
				if (my.buttonblock.find('button#'+key).size())
					my.buttonblock.find('button#'+key).off('click').on('click',function(){
						if (values!=null) values();
					});
			});
			this.text.attr('placeholder',options.placeholder);
			if (options.type=='add')
			{
				this.text.val('');
				this.checkbox.hide();
				$('button#del',this.container).hide();
			}
			else
			{
				this.checkbox.show();
				$('button#del',this.container).show();
			}
			this.cover.show();
			this.container.css({'height':(this.contents.outerHeight(true)+this.buttonblock.outerHeight(true)).toString()+'px'});
		},
		/* hide calendar */
		hide:function(){
			this.cover.hide();
		}
	};
	jQuery.fn.editor=function(options){
		var options=$.extend({
			container:null,
			buttons:{}
		},options);
		options.container=this;
		return new EditDialog(options);
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
		if (!vars.ismobile) if (event.viewType.toUpperCase()=='CALENDAR') return event;
		/* initialize valiable */
		vars.markers=[];
		if (vars.map!=null)
		{
			if (vars.config['chasemode']=='1') vars.map.unwatchlocation();
		}
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			/* load datas */
			vars.isdisplaymap=false;
			vars.apps[vars.config['app']]=null;
			vars.offset[vars.config['app']]=0;
			if (vars.ismobile)
			{
				kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:vars.config['app']},function(resp){
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
					    if (values.type.toUpperCase()=='LIST') vars.viewlist.append($('<option>').text(values.name).val(values.filterCond));
					})
					vars.viewlist.on('change',function(){
						if (vars.config['chasemode']=='1') vars.map.unwatchlocation();
						vars.isdisplaymap=false;
						vars.apps[vars.config['app']]=null;
						vars.offset[vars.config['app']]=0;
						functions.loaddatas($(this).val(),function(){
							functions.reloadmap(function(){
								vars.isdisplaymap=true;
								$('div.customview-navi').hide();
							});
						});
					});
					functions.loaddatas($('option',vars.viewlist).first().val(),function(){functions.reloadmap(function(){vars.isdisplaymap=true;});});
				},function(error){});
			}
			else functions.loaddatas('');
		},function(error){});
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
					if ($('body').fields(vars.config['pluscode'])[0].val().length==0)
						functions.displaymap({
							address:target.val(),
							callback:function(json){
								$('body').fields(vars.config['pluscode'])[0].val(json.results[0].global_code);
								$('body').fields(vars.config['lat'])[0].val(json.results[0].geometry.location.lat);
								$('body').fields(vars.config['lng'])[0].val(json.results[0].geometry.location.lng);
							}
						});
				})
			);
			input=$('body').fields(vars.config['pluscode'])[0];
			button=$('<button class="customsearch-button">');
			height=input.outerHeight(false);
			if (height-30>0) button.css({'margin':((height-30)/2).toString()+'px','min-height':'30px','min-width':'30px'});
			else button.css({'background-size':height.toString()+'px '+height.toString()+'px','margin':'0px','min-height':height.toString()+'px','min-width':height.toString()+'px'});
			input.css({'padding-right':height.toString()+'px'})
			.closest('div').append(
				button.on('click',function(){
					var target=$(this).closest('div').find('input');
					functions.displaymap({
						pluscode:target.val(),
						callback:function(json){
							$('body').fields(vars.config['address'])[0].val(json.plus_code.best_street_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}/g,''));
							$('body').fields(vars.config['lat'])[0].val(json.plus_code.geometry.location.lat);
							$('body').fields(vars.config['lng'])[0].val(json.plus_code.geometry.location.lng);
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
			if (event.record[vars.config['pluscode']].value!=null)
				return new kintone.Promise(function(resolve,reject){
					kintone.proxy(
						'https://plus.codes/api?address='+encodeURIComponent(event.record[vars.config['pluscode']].value)+'&ekey='+vars.config['apikey']+'&language=ja',
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
										var address=json.plus_code.best_street_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}/g,'');
										var lat=json.plus_code.geometry.location.lat;
										var lng=json.plus_code.geometry.location.lng;
										event.record[vars.config['address']].value=address;
										event.record[vars.config['lat']].value=lat;
										event.record[vars.config['lng']].value=lng;
										break;
								}
								resolve(event);
							}
						}
					);
				});
			else
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
										kintone.proxy(
											'https://plus.codes/api?address='+lat+','+lng+'&ekey='+vars.config['apikey']+'&language=ja',
											'GET',
											{},
											{},
											function(body,status,headers){
												if (status>=200 && status<300){
													switch (json.status)
													{
														case 'ZERO_RESULTS':
														case 'OVER_QUERY_LIMIT':
														case 'REQUEST_DENIED':
														case 'INVALID_REQUEST':
															break;
														case 'OK':
															event.record[vars.config['pluscode']].value=JSON.parse(body).plus_code.global_code;
															break;
													}
													resolve(event);
												}
											}
										);
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
