/*
*--------------------------------------------------------------------
* jQuery-Plugin "customersinfo"
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
		isopened:false,
		limit:500,
		offset:0,
		displaymarkers:null,
		displaytraffic:null,
		map:null,
		config:{},
		fieldinfos:{},
		markers:{},
		events:[],
		markercolors:[],
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show',
			'mobile.app.record.detail.show'
		]
	};
	var functions={
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
									alert('地図座標が取得出来ませんでした。');
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
				if (vars.map!=null)
				{
					var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
					vars.map.empty();
					vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
				}
		},
		/* data load */
		loaddatas:function(condition,callback){
			var filters=((condition==null)?'':condition);
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:kintone.app.getId(),query:filters+' limit '+vars.limit.toString()+' offset '+vars.offset.toString()},function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(condition,callback);
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
					}
					else
					{
						vars.map=$('body').routemap(vars.config['apikey'],function(){
							/* create map */
							vars.markers=functions.loadmarkers();
							if (callback!=null) callback();
							/* setup centering */
							google.maps.event.addListener(vars.map.map,'idle',function(){
								vars.centerLocation=vars.map.map.getCenter();
							});
							$(window).on('resize',function(e){
								google.maps.event.trigger(vars.map.map,'resize');
								vars.map.map.setCenter(vars.centerLocation);
							});
						},
						isreload,
						function(results,latlng){},
						function(target){
						});
						/* create displaytraffic checkbox */
						vars.displaytraffic=checkbox.clone(true)
						.append($('<input type="checkbox">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								/* swtich view of traffic */
								vars.map.reloadtraffic($(this).prop('checked'));
							})
						)
						.append(span.clone(true).text('交通状況表示'));
						vars.displaytraffic.find('input[type=checkbox]').prop('checked',false);
						/* create displaymarkers checkbox */
						vars.displaymarkers=checkbox.clone(true)
						.append($('<input type="checkbox" id="poi">')
							.on('change',function(e){
								/* swtich view of menu */
								if ($('.customview-menu').is(':visible'))
								{
									if (vars.ismobile) $('div.customview-navi').hide();
									else $('div.customview-navi').removeClass('show');
								}
								/* swtich view of makrers */
								for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setVisible($(this).prop('checked'));
							})
						)
						.append(span.clone(true).text('マーカー表示'));
						vars.displaymarkers.find('input[type=checkbox]').prop('checked',true);
						/* append buttons */
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
										.prepend(vars.displaytraffic)
										.prepend(vars.displaymarkers)
								)
							)
						);
					}
				}
			},function(error){});
		},
		/* marker load */
		loadmarkers:function(){
			var informations=JSON.parse(vars.config['informations']);
			var markers=[];
			for (var i=0;i<vars.records.length;i++)
			{
				var record=vars.records[i];
				var group={records:[record]};
				var latlng='';
				var lat=parseFloat('0'+record[vars.config['lat']].value);
				var lng=parseFloat('0'+record[vars.config['lng']].value);
				var label='';
				var datespan='';
				if (lat+lng!=0)
				{
					latlng=lat.toString()+lng.toString();
					if (latlng in vars.markers)
					{
						var filter=$.grep(vars.markers[latlng].groups,function(item,index){
							var exists=0;
							var keys=Object.keys(item);
							for (var i2=0;i2<keys.length;i2++)
								if (keys[i2]!='records')
									if (item[keys[i2]]==record[keys[i]].value) exists++;
							return exists==keys.length-1;
						});
						if (filter.length!=0) filter[0].records.push(record);
						else
						{
							group[vars.config['date']]=record[vars.config['date']].value;
							group[vars.config['starttime']]=record[vars.config['starttime']].value;
							group[vars.config['endtime']]=record[vars.config['endtime']].value;
							for (var i2=0;i2<informations.length;i2++) group[informations[i2]]=record[informations[i2]].value;
							vars.markers[latlng].groups.push(group);
						}
					}
					else
					{
						var marker={
							id:latlng,
							colors:vars.markercolors[0],
							lat:lat,
							lng:lng,
							groups:[]
						};
						group[vars.config['date']]=record[vars.config['date']].value;
						group[vars.config['starttime']]=record[vars.config['starttime']].value;
						group[vars.config['endtime']]=record[vars.config['endtime']].value;
						for (var i2=0;i2<informations.length;i2++) group[informations[i2]]=record[informations[i2]].value;
						marker.groups.push(group);
						markers[latlng]=marker;
					}
				}
			}
			return markers;
		},
		/* swtich view of marker */
		reloadmap:function(callback){
			var markers=[];
			/* setup color */
			$.each(vars.markers,function(key,values){
				var color=vars.markercolors[0];
				var now=new Date();
				var starttime=new Date((values.groups[0].date+' '+values.groups[0].starttime+':00').dateformat());
				var endtime=new Date((values.groups[0].date+' '+values.groups[0].endtime+':00').dateformat());
				if (now>starttime) color=vars.markercolors[1];
				if (now>starttime && now>endtime.calc('-3 hour')) color=vars.markercolors[2];
				if (now>starttime && now>endtime.calc('-1 hour')) color=vars.markercolors[3];
				if (now>starttime && now>endtime) color=vars.markercolors[4];
				values.colors=color;
				markers.push(value);
			});
			/* display map */
			vars.map.reloadmap({
				markers:markers,
				callback:function(){
					for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(i+1);
					if (callback!==undefined) callback();
				}
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check viewid */
		if (event.viewId!=vars.config['targetview']) return;
		/* initialize valiable */
		vars.offset=0;
		vars.records=[];
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			vars.markercolors=JSON.parse(vars.config['markercolors']);
			/* create buttons */
			if ($('.displaymap').size()) $('.displaymap').remove();
			kintone.app.getHeaderMenuSpaceElement().appendChild(
				$('<div class="waitingbutton displaymap">').css({
					'cursor':'pointer',
					'display':'inline-block',
					'height':'48px',
					'margin':'0px 12px',
					'vertical-align':'top',
					'width':'48px'
				})
				.on('click',function(e){
					if ($(this).hasClass('waitingbutton')) return;
					functions.reloadmap(function(){
						if (!vars.isopened)
						{
							vars.map.currentlocation({callback:function(latlng){
								vars.map.map.setCenter(latlng);
							}});
						}
						vars.isopened=true;
					});
				})[0]
			);
			/* load datas */
			functions.loaddatas(kintone.app.getQueryCondition(),function(){
				$('.displaymap')
				.removeClass('waitingbutton')
				.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/compass.svg" alt="地図を表示" title="地図を表示" />').css({'width':'100%'}));
			});
		},function(error){});
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check device */
		vars.ismobile=event.type.match(/mobile/g);
		/* hide elements  */
		if (!vars.ismobile)
		{
			kintone.app.record.setFieldShown(vars.config['lat'],false);
			kintone.app.record.setFieldShown(vars.config['lng'],false);
		}
		else
		{
			kintone.mobile.app.record.setFieldShown(vars.config['lat'],false);
			kintone.mobile.app.record.setFieldShown(vars.config['lng'],false);
		}
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		/* the initial display when editing */
		if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record.lat.value+','+event.record.lng.value});
		if (!vars.ismobile) kintone.app.record.getSpaceElement(vars.config['spacer']).appendChild(vars.map[0]);
		return event;
	});
	if ('address' in vars.config)
	{
		vars.events.push('app.record.create.change.'+vars.config['address']);
		vars.events.push('mobile.app.record.create.change.'+vars.config['address']);
		vars.events.push('app.record.edit.change.'+vars.config['address']);
		vars.events.push('mobile.app.record.edit.change.'+vars.config['address']);
		/* display map in value change event */
		kintone.events.on(vars.events,function(event){
			if (event.changes.field.value)
			{
				functions.displaymap({
					address:event.changes.field.value,
					callback:function(json){
						var record=(event.type.match(/mobile/g)!=null)?kintone.mobile.app.record.get():kintone.app.record.get();
						record.record[vars.config['lat']].value=json.results[0].geometry.location.lat;
						record.record[vars.config['lng']].value=json.results[0].geometry.location.lng;
						if (event.type.match(/mobile/g)!=null) kintone.mobile.app.record.set(record);
						else kintone.app.record.set(record);
					}
				});
			}
			else
			{
				event.record[vars.config['lat']].value=null;
				event.record[vars.config['lng']].value=null;
			}
			return event;
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
