/*
*--------------------------------------------------------------------
* jQuery-Plugin "request"
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
		container:null,
		displaymarkers:null,
		displaytraffic:null,
		request:null,
		map:null,
		config:{},
		markers:{},
		requestcolors:[],
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var requestdialog=function(){
		/* property */
		/* create elements */
		var my=this;
		var table=$('<table>')
		.append(
			$('<thead>')
			.append(
				$('<tr>')
				.append($('<th>'))
				.append($('<th>').text('車輌ステータス'))
				.append($('<th>').text('ドライバー'))
				.append($('<th>').text('車種'))
				.append($('<th>').text('自走区分'))
				.append($('<th>').text('車輌状態'))
				.append($('<th>').text('搬入先'))
			)
		)
		.append(
			$('<tbody>')
			.append(
				$('<tr>')
				.append(
					$('<td class="button">')
					.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/edit.png" class="edit">'))
					.append($('<input type="hidden" id="id">'))
				)
				.append($('<td class="status">').append($('<span id="status">')))
				.append($('<td>').append($('<span id="driver">')))
				.append($('<td>').append($('<span id="car">')))
				.append($('<td>').append($('<span id="carownmove">')))
				.append($('<td>').append($('<span id="carcondition">')))
				.append($('<td>').append($('<span id="destination">')))
			)
		);
		var dataview=$('<div class="dataview">').append($('<span class="label">'));
		/* append elements */
		this.cover=$('<div class="customview-dialog request">');
		this.container=$('<div class="customview-dialog-container">');
		this.contents=$('<div class="customview-dialog-contents">');
		this.buttonblock=$('<div class="customview-dialog-buttons">');
		this.table=table.clone(true).adjustabletable();
		this.contents.append(dataview.clone(true).attr('id','datetime'));
		this.contents.append(dataview.clone(true).attr('id','owner'));
		this.contents.append(dataview.clone(true).attr('id','tel'));
		this.contents.append(this.table.container);
		this.buttonblock.append(
			$('<button>')
			.attr('id','prev')
			.text('前へ')
		);
		this.buttonblock.append(
			$('<button>')
			.attr('id','next')
			.text('次へ')
		);
		this.buttonblock.append(
			$('<button>')
			.attr('id','cancel')
			.text('閉じる')
			.on('click',function(){
				my.hide();
			})
		);
		this.container.append(this.contents);
		this.container.append(this.buttonblock);
		this.cover.append(this.container);
		$('body').append(this.cover);
		/* adjust container height */
		$(window).on('load resize',function(){
			my.contents.css({'height':(my.container.innerHeight()-my.buttonblock.outerHeight(true)).toString()+'px'});
		});
	};
	requestdialog.prototype={
		/* display form */
		show:function(options){
			var options=$.extend({
				buttons:{}
			},options);
			var my=this;
			$.each(options.buttons,function(key,values){
				if (my.buttonblock.find('button#'+key).size())
					my.buttonblock.find('button#'+key).off('click').on('click',function(){if (values!=null) values();});
			});
			this.cover.show();
			/* adjust container height */
			this.contents.css({'height':(this.container.innerHeight()-this.buttonblock.outerHeight(true)).toString()+'px'});
		},
		/* hide form */
		hide:function(){
			this.cover.hide();
		}
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
			filters=filters.replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'');
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
						vars.container=$('<div class="requestcontainer">');
						$('body').append(vars.container);
						vars.map=vars.container.routemap(vars.config['apikey'],function(){
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
							var index=0;
							var displaycars=function(callback){
								var record=vars.markers[target].groups[index];
								var row=null;
								$('#datetime',vars.request.contents).find('.label').html(record[vars.config['date']]+'&nbsp;&nbsp;'+record[vars.config['starttime']]+' ～ '+record[vars.config['endtime']]);
								$('#owner',vars.request.contents).find('.label').html(record[vars.config['owner']]+'&nbsp;('+record[vars.config['transportation']]+')');
								$('#tel',vars.request.contents).find('.label').html(record[vars.config['tel']]);
								vars.request.table.clearrows();
								for (var i=0;i<record.records.length;i++)
								{
									vars.request.table.addrow();
									row=vars.request.table.rows.last();
									$('span#status',row).text(record.records[i][vars.config['status']].value);
									$('span#car',row).text(record.records[i][vars.config['car']].value);
									$('span#carownmove',row).text(record.records[i][vars.config['carownmove']].value);
									$('span#carcondition',row).text(record.records[i][vars.config['carcondition']].value);
									$('span#destination',row).text((record.records[i][vars.config['destination']].value)?record.records[i][vars.config['destination']].value:'');
									$('input#id',row).val(record.records[i]['$id'].value);
									if (record.records[i][vars.config['driver']].value.length==0) $('span#driver',row).text('');
									else $('span#driver',row).text(record.records[i][vars.config['driver']].value[0].name);
									$('.edit',row).on('click',function(){
										window.open('https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+$('#id',$(this).closest('td')).val()+'&mode=show');
									});
								}
								if (callback) callback();
							}
							/* marker click */
							if (!(target in vars.markers)) return;
							displaycars(function(){
								$('#prev',vars.request.buttonblock).prop('disabled',true);
								$('#next',vars.request.buttonblock).prop('disabled',(vars.markers[target].groups.length==1));
								vars.request.show({
									buttons:{
										prev:function(){
											index--;
											displaycars(function(){
												$('#prev',vars.request.buttonblock).prop('disabled',(index==0));
												$('#next',vars.request.buttonblock).prop('disabled',false);
											});
										},
										next:function(){
											index++;
											displaycars(function(){
												$('#prev',vars.request.buttonblock).prop('disabled',false);
												$('#next',vars.request.buttonblock).prop('disabled',(index==vars.markers[target].groups.length-1));
											});
										}
									}
								});
							});
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
						vars.request=new requestdialog();
					}
				}
			},function(error){});
		},
		/* marker load */
		loadmarkers:function(){
			var markers={};
			for (var i=0;i<vars.records.length;i++)
			{
				var record=vars.records[i];
				var group={};
				var latlng='';
				var lat=parseFloat('0'+record[vars.config['lat']].value);
				var lng=parseFloat('0'+record[vars.config['lng']].value);
				if (lat+lng!=0)
				{
					latlng=lat.toString()+lng.toString();
					group[vars.config['date']]=record[vars.config['date']].value;
					group[vars.config['starttime']]=record[vars.config['starttime']].value;
					group[vars.config['endtime']]=record[vars.config['endtime']].value;
					group[vars.config['owner']]=record[vars.config['owner']].value;
					group[vars.config['tel']]=record[vars.config['tel']].value;
					group[vars.config['transportation']]=record[vars.config['transportation']].value;
					group['records']=[record];
					if (latlng in markers)
					{
						var filter=$.grep(markers[latlng].groups,function(item,index){
							var exists=0;
							var keys=Object.keys(item);
							for (var i2=0;i2<keys.length;i2++)
								if (keys[i2]!='records')
									if (item[keys[i2]]==record[keys[i2]].value) exists++;
							return exists==keys.length-1;
						});
						if (filter.length!=0) filter[0].records.push(record);
						else markers[latlng].groups.push(group);
					}
					else
					{
						var marker={
							id:latlng,
							colors:vars.requestcolors[0],
							lat:lat,
							lng:lng,
							groups:[group]
						};
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
				var check=0;
				var color=vars.requestcolors[0];
				var now=new Date(new Date().format('Y-m-d').dateformat());
				var span=(new Date(values.groups[0][vars.config['date']].dateformat()).getTime()-now.getTime())/(1000*60*60*24);
				if (values.groups.length>1) color=vars.requestcolors[8];
				else
				{
					if (span>0) color=vars.requestcolors[1];
					if (span>1) color=vars.requestcolors[2];
					if (span>2) color=vars.requestcolors[3];
					if (span>3) color=vars.requestcolors[4];
					if (span>4) color=vars.requestcolors[5];
					if (span>5) color=vars.requestcolors[6];
					if (span>6) color=vars.requestcolors[7];
				}
				for (var i=0;i<values.groups.length;i++) check+=values.groups[i].records.length;
				values.colors=color;
				values.label=check;
				markers.push(values);
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
		if (event.viewId!=vars.config['requestview']) return;
		/* initialize valiable */
		vars.offset=0;
		vars.records=[];
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.requestcolors=JSON.parse(vars.config['requestcolors']);
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
						if (!vars.isopened) vars.map.allmarkersview();
						vars.isopened=true;
					});
				})[0]
			);
			/* load datas */
			functions.loaddatas(kintone.app.getQuery(),function(){
				$('.displaymap')
				.removeClass('waitingbutton')
				.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/compass.svg" alt="地図を表示" title="地図を表示" />').css({'width':'100%'}));
			});
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
