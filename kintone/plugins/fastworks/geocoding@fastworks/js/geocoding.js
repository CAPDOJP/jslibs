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
		map:null,
		apps:{},
		config:{},
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
		loaddatas:function(callback){
			var filters=kintone.app.getQuery();
			if (filters==null) filters='order by $id asc';
			else filters=filters.replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'');
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:kintone.app.getId(),query:filters+' limit '+limit.toString()+' offset '+vars.offset[kintone.app.getId()].toString()},function(resp){
				if (vars.apps[kintone.app.getId()]==null) vars.apps[kintone.app.getId()]=resp.records;
				else Array.prototype.push.apply(vars.apps[kintone.app.getId()],resp.records);
				vars.offset[kintone.app.getId()]+=limit;
				if (resp.records.length==limit) functions.loaddatas(callback);
				else
				{
					/* create map */
					var isreload=(vars.map!=null);
					if (isreload) vars.map.container.remove();
					vars.map=$('body').routemap(vars.config['apikey'],true,false,function(){
						/* create map */
						vars.map.map.setOptions({styles:vars.styles.hide});
						$.each(vars.apps[kintone.app.getId()],function(index,values){
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
								label+='<br><a href="https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+record['$id'].value+'" target="_blank">詳細画面へ</a>';
								vars.markers.push({
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
						/* append elements */
						kintone.app.getHeaderMenuSpaceElement().innerHTML='';
						kintone.app.getHeaderMenuSpaceElement().appendChild(vars.displaymap[0]);
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
						if (callback!=null) callback();
					},isreload);
					vars.map.buttonblock
					.prepend(
						$('<button class="customview-menu">')
						.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/menu.svg" alt="メニュー" title="メニュー" />'))
						.on('click',function(){
							$('div.customview-navi').addClass('show');
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
										.on('click',function(){
											$('div.customview-navi').removeClass('show');
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
				}
			},function(error){});
		},
		/* swtich view of marker */
		reloadmap:function(callback){
			var iscurrentlocation=vars.currentlocation.find('input[type=checkbox]').prop('checked');
			var isextensionindex=vars.displaydatespan.find('input[type=checkbox]').prop('checked');
			var isopeninfowindow=vars.displayinfowindow.find('input[type=checkbox]').prop('checked');
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
							$.each(vars.apps[kintone.app.getId()],function(index,values){
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
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check display map */
		if (!'map' in vars.config) return event;
		if (vars.config['map']!='1') return event;
		/* check view type */
		if (event.viewType.toUpperCase()=='CALENDAR') return event;
		/* initialize valiable */
		vars.markers=[];
		vars.ismobile=(navigator.userAgent.indexOf('iPhone')>0 || navigator.userAgent.indexOf('iPad')>0 || navigator.userAgent.indexOf('Android')>0);
		/* check viewport */
		if (!$('meta[name=viewport]').size()) $('meta').last().after($('<meta name="viewport">').attr('content','width=device-width,initial-scale=1.0'));
		/* create currentlocation checkbox */
		vars.currentlocation=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="currentlocation">')
			.on('change',function(e){
				/* swtich view of menu */
				if ($('.customview-menu').is(':visible')) $('div.customview-navi').removeClass('show');
				/* swtich view of marker */
				functions.reloadmap(function(){
					vars.chaselocation.find('input[type=checkbox]').prop('checked',vars.currentlocation.find('input[type=checkbox]').prop('checked'));
				});
			})
		)
		.append($('<span>現在地を表示</span>'));
		vars.currentlocation.find('input[type=checkbox]').prop('checked',vars.ismobile);
		/* create chaselocation checkbox */
		vars.chaselocation=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="chaselocation">')
			.on('change',function(e){
				/* swtich view of menu */
				if ($('.customview-menu').is(':visible')) $('div.customview-navi').removeClass('show');
			})
		)
		.append($('<span>現在地を追跡</span>'));
		vars.chaselocation.find('input[type=checkbox]').prop('checked',vars.ismobile);
		if (vars.config['chasemode']!='1') vars.chaselocation.hide();
		/* create displayinfowindow checkbox */
		vars.displayinfowindow=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="infowindow">')
			.on('change',function(e){
				/* swtich view of menu */
				if ($('.customview-menu').is(':visible')) $('div.customview-navi').removeClass('show');
				if ($(this).prop('checked')) vars.map.openinfowindow();
				else vars.map.closeinfowindow();
			})
		)
		.append($('<span>情報ウインドウを表示</span>'));
		/* create displaydatespan checkbox */
		vars.displaydatespan=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="datespan">')
			.on('change',function(e){
				/* swtich view of menu */
				if ($('.customview-menu').is(':visible')) $('div.customview-navi').removeClass('show');
				var color='';
				var colors=JSON.parse(vars.config['datespancolors']);
				for (var i=0;i<vars.markers.length;i++)
				{
					color=vars.config['defaultcolor'];
					if ($(this).prop('checked'))
					{
						var datespan=vars.markers[i].extensionindex;
						$.each(colors,function(key,values){
							if (parseInt(datespan)>parseInt(key)-1){color=values;}
						});
					}
					vars.markers[i].colors=color;
				}
				functions.reloadmap();
			})
		)
		.append($('<span>経過日数を表示</span>'));
		if (vars.config["datespan"].length==0) vars.displaydatespan.css({'display':'none'});
		/* create displaypoi checkbox */
		vars.displaypoi=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="poi">')
			.on('change',function(e){
				/* swtich view of menu */
				if ($('.customview-menu').is(':visible')) $('div.customview-navi').removeClass('show');
				/* swtich view of poi */
				if ($(this).prop('checked')) vars.map.map.setOptions({styles:vars.styles.show});
				else vars.map.map.setOptions({styles:vars.styles.hide});
			})
		)
		.append($('<span>施設を表示</span>'));
		/* create display map button */
		vars.displaymap=$('<button class="kintoneplugin-button-dialog-ok">')
		.text('地図を表示')
		.on('click',function(e){
			functions.reloadmap(function(){vars.isdisplaymap=true;});
		});
		/* load datas */
		vars.apps[kintone.app.getId()]=null;
		vars.offset[kintone.app.getId()]=0;
		functions.loaddatas(function(){
			if (vars.ismobile) functions.reloadmap(function(){vars.isdisplaymap=true;});
		});
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
