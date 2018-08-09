/*
*--------------------------------------------------------------------
* jQuery-Plugin "allocation"
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
		allocation:null,
		latlngmap:null,
		map:null,
		config:{},
		fieldinfos:{},
		markers:{},
		users:{},
		events:[],
		allocationcolors:[],
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
	var allocationdialog=function(){
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
				$('<tr draggable="true">')
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
		this.cover=$('<div class="customview-dialog allocation">');
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
	allocationdialog.prototype={
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
				vars.latlngmap.inaddress({
					address:options.address,
					callback:function(result){
						var lat=result.geometry.location.lat();
						var lng=result.geometry.location.lng();
						var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURIComponent(options.address)+'@'+lat+','+lng+'&amp;ie=UTF8&amp;ll='+lat+','+lng+'&amp;z=14&amp;t=m&amp;output=embed';
						if (vars.map!=null)
						{
							vars.map.empty();
							vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
						}
						if (options.callback!=null) options.callback(result);
					}
				})
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
			filters=filters.replace(new RegExp(vars.config['status']+' in \\([^)]+\\)( and )*','g'),'').replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'');
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
						vars.container=$('<div class="allocationcontainer">').append($('<div class="usercontainer">'));
						$('body').append(vars.container);
						$.loadusers(function(records){
							records.sort(function(a,b){
								if(a.code<b.code) return 1;
								if(a.code>b.code) return -1;
								return 0;
							});
							vars.users={};
							functions.setupuser(records,function(){
								$.each(vars.users,function(key,values){
									functions.setupuserdata(key);
								});
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
										$('#datetime',vars.allocation.contents).find('.label').html(record[vars.config['date']]+'&nbsp;&nbsp;'+record[vars.config['starttime']]+' ～ '+record[vars.config['endtime']]);
										$('#owner',vars.allocation.contents).find('.label').html(record[vars.config['owner']]+'&nbsp;('+record[vars.config['transportation']]+')');
										$('#tel',vars.allocation.contents).find('.label').html(record[vars.config['tel']]);
										vars.allocation.table.clearrows();
										for (var i=0;i<record.records.length;i++)
										{
											vars.allocation.table.addrow();
											row=vars.allocation.table.rows.last();
											$('span#status',row).text(record.records[i][vars.config['status']].value);
											$('span#car',row).text(record.records[i][vars.config['car']].value);
											$('span#carownmove',row).text(record.records[i][vars.config['carownmove']].value);
											$('span#carcondition',row).text(record.records[i][vars.config['carcondition']].value);
											$('span#destination',row).text((record.records[i][vars.config['destination']].value)?record.records[i][vars.config['destination']].value:'');
											$('input#id',row).val(record.records[i]['$id'].value);
											if (record.records[i][vars.config['driver']].value.length==0) $('span#driver',row).text('');
											else $('span#driver',row).text(record.records[i][vars.config['driver']].value[0].name);
											$('.edit',row).on('click',function(){
												window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$('#id',$(this).closest('td')).val()+'&mode=show');
											});
											row.on('dragstart',function(e){
												var dragevent=e;
												if (e.originalEvent) dragevent=e.originalEvent;
												dragevent.dataTransfer.setData("id",$('input#id',$(this)).val());
											});
										}
										if (callback) callback();
									}
									/* marker click */
									if (!(target in vars.markers)) return;
									displaycars(function(){
										$('#prev',vars.allocation.buttonblock).prop('disabled',true);
										$('#next',vars.allocation.buttonblock).prop('disabled',(vars.markers[target].groups.length==1));
										vars.allocation.show({
											buttons:{
												prev:function(){
													index--;
													displaycars(function(){
														$('#prev',vars.allocation.buttonblock).prop('disabled',(index==0));
														$('#next',vars.allocation.buttonblock).prop('disabled',false);
													});
												},
												next:function(){
													index++;
													displaycars(function(){
														$('#prev',vars.allocation.buttonblock).prop('disabled',false);
														$('#next',vars.allocation.buttonblock).prop('disabled',(index==vars.markers[target].groups.length-1));
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
														vars.allocation.hide();
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
								vars.allocation=new allocationdialog();
							});
						});
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
							colors:vars.allocationcolors[0],
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
				var color=vars.allocationcolors[0];
				var now=new Date();
				var starttime=new Date((values.groups[0][vars.config['date']]+'T'+values.groups[0][vars.config['starttime']]+':00+0900').dateformat());
				var endtime=new Date((values.groups[0][vars.config['date']]+'T'+values.groups[0][vars.config['endtime']]+':00+0900').dateformat());
				if (now>starttime) color=vars.allocationcolors[1];
				if (now>starttime && now>endtime.calc('-3 hour')) color=vars.allocationcolors[2];
				if (now>starttime && now>endtime.calc('-1 hour')) color=vars.allocationcolors[3];
				if (now>starttime && now>endtime) color=vars.allocationcolors[4];
				for (var i=0;i<values.groups.length;i++)
				{
					var group=values.groups[i];
					for (var i2=0;i2<group.records.length;i2++)
					{
						var record=group.records[i2];
						if (record[vars.config['driver']].value.length==0) check++;
					}
				}
				if (check!=0)
				{
					values.colors=color;
					values.label=check;
					markers.push(values);
				}
			});
			/* display map */
			vars.map.reloadmap({
				markers:markers,
				callback:function(){
					for (var i=0;i<vars.map.markers.length;i++) vars.map.markers[i].setZIndex(i+1);
					if (callback!==undefined) callback();
				}
			});
		},
		/* setup user list */
		setupuser:function(records,callback){
			var counter=records.length;
			for (var i=0;i<records.length;i++)
			{
				var container=$('<div class="users">')
				.append(
					$('<div class="user">')
					.append($('<span class="name">'))
					.append($('<span class="count">'))
				)
				.append($('<div class="cars">'))
				.append($('<input type="hidden" id="code">'));
				$('.usercontainer',vars.container).append(container);
				(function(record,container,success,fail){
					kintone.api(kintone.api.url('/v1/user/organizations',true),'GET',{code:record.code},function(resp){
						var exists=false;
						for (var i2=0;i2<resp.organizationTitles.length;i2++)
							if (resp.organizationTitles[i2].organization.code==vars.config['organization']) exists=true;
						if (exists) success(record,container);
						else fail(container);
					},function(error){fail(container);});
				})(records[i],container,function(record,container){
					$('.name',container).text(record.name);
					$('#code',container).val(record.code);
					vars.users[record.code]={
						code:record.code,
						name:record.name,
						container:container,
						records:$.grep(vars.records,function(item,index){
							var exists=false;
							for (var i2=0;i2<item[vars.config['driver']].value.length;i2++)
							{
								var hit=0;
								if (item[vars.config['driver']].value[i2].code==record.code) hit++;
								if (item[vars.config['status']].value==vars.config['statusallocatevalue']) hit++;
								if (item[vars.config['status']].value==vars.config['statusdonevalue']) hit++;
								if (hit==2) exists=true;
							}
							return exists;
						})
					}
					/* drag&drop events */
					container.on('dragover',function(e){
						var dragevent=e;
						if(e.originalEvent) dragevent=e.originalEvent;
						$(this).addClass('dragging');
						e.stopPropagation();
						e.preventDefault();
					});
					container.on('dragleave',function(e){
						var dragevent=e;
						if(e.originalEvent) dragevent=e.originalEvent;
						$(this).removeClass('dragging');
						e.stopPropagation();
						e.preventDefault();
					});
					container.on('drop',function(e){
						/* upload */
						var dragevent=e;
						var body={
							app:kintone.app.getId(),
							id:'',
							record:{}
						};
						var container=$(this);
						var code=$('#code',container).val();
						if(e.originalEvent) dragevent=e.originalEvent;
						body.id=dragevent.dataTransfer.getData('id');
						body.record[vars.config['driver']]={value:[{code:code}]};
						body.record[vars.config['status']]={value:vars.config['statusallocatevalue']};
						kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
							var filter=$.grep(vars.records,function(item,index){
								return item['$id'].value==body.id;
							});
							filter[0][vars.config['driver']].value=[{code:code,name:$('.name',container).text()}];
							filter[0][vars.config['status']].value=vars.config['statusallocatevalue'];
							vars.users[code].records.push(filter[0]);
							functions.setupuserdata(code,function(){
								$('.cars',container).slideDown('fast');
								functions.reloadmap(function(){
									var row=null;
									for (var i2=0;i2<vars.allocation.table.rows.length;i2++)
									{
										row=vars.allocation.table.rows.eq(i2);
										if ($('#id',row).val()==body.id)
										{
											$('span#driver',row).text($('.name',container).text());
											$('span#status',row).text(vars.config['statusallocatevalue']);
										}
									}
								});
							});
						},function(error){
							swal('Error!',error.message,'error');
						});
						$(this).removeClass('dragging');
						e.stopPropagation();
						e.preventDefault();
					});
					counter--;
					if (counter==0) callback();
				},function(container){
					container.remove();
					counter--;
					if (counter==0) callback();
				});
			}
		},
		/* setup user information */
		setupuserdata:function(code,callback){
			var container=vars.users[code].container;
			var records=vars.users[code].records;
			var owner='';
			var car={};
			var cars=[];
			records.sort(function(a,b){
				if(a[vars.config['owner']].value<b[vars.config['owner']].value) return 1;
				if(a[vars.config['owner']].value>b[vars.config['owner']].value) return -1;
				return 0;
			});
			$('.cars',container).empty();
			for (var i=0;i<records.length;i++)
			{
				if (owner!=records[i][vars.config['owner']].value)
				{
					owner=records[i][vars.config['owner']].value;
					var filter=$.grep(cars,function(item,index){
						return item.owner==owner;
					});
					if (filter.length==0)
					{
						car={
							owner:owner,
							records:[]
						};
						cars.push(car);
					}
					else car=filter[0];
				}
				car.records.push(records[i]);
			}
			cars.sort(function(a,b){
				var fromdone=0;
				var todone=0;
				for (var i=0;i<a.records.length;i++) if (a.records[i][vars.config['status']].value==vars.config['statusdonevalue']) fromdone++;
				for (var i=0;i<b.records.length;i++) if (b.records[i][vars.config['status']].value==vars.config['statusdonevalue']) todone++;
				if(fromdone<todone) return -1;
				if(fromdone>todone) return 1;
				return 0;
			});
			for (var i=0;i<cars.length;i++)
			{
				cars[i].records.sort(function(a,b){
					if(a[vars.config['status']].value<b[vars.config['status']].value) return 1;
					if(a[vars.config['status']].value>b[vars.config['status']].value) return -1;
					return 0;
				});
				$('.cars',container).append(
					$('<span class="owner">').html(cars[i].owner)
				);
				for (var i2=0;i2<cars[i].records.length;i2++)
				{
					var color='';
					var style='';
					if (cars[i].records[i2][vars.config['status']].value==vars.config['statusallocatevalue']) color=vars.config['statusallocatecolor'];
					else
					{
						color=vars.config['statusdonecolor'];
						style='style="visibility:hidden"';
					}
					$('.cars',container).append(
						$('<span class="car">').html('<span style="color:#'+color+'">●</span><span>'+cars[i].records[i2][vars.config['car']].value+'</span>')
						.append(
							$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/edit.png" class="edit">')
							.on('click',function(){
								window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+$('#id',$(this).closest('.car')).val()+'&mode=show');
							})
						)
						.append(
							$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" class="clear" '+style+'>')
							.on('click',function(){
								var body={
									app:kintone.app.getId(),
									id:'',
									record:{}
								};
								body.id=$('#id',$(this).closest('.car')).val();
								body.record[vars.config['driver']]={value:[]};
								body.record[vars.config['status']]={value:vars.config['statusdenyvalue']};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									var filter=$.grep(vars.records,function(item,index){
										return item['$id'].value==body.id;
									});
									filter[0][vars.config['driver']].value=[];
									filter[0][vars.config['status']].value=vars.config['statusdenyvalue'];
									vars.users[code].records=$.grep(vars.users[code].records,function(item,index){
										return item['$id'].value!=body.id;
									});
									functions.setupuserdata(code,function(){
										$('.cars',container).slideDown('fast');
										functions.reloadmap(function(){
											var row=null;
											for (var i3=0;i3<vars.allocation.table.rows.length;i3++)
											{
												row=vars.allocation.table.rows.eq(i3);
												if ($('#id',row).val()==body.id)
												{
													$('span#driver',row).text('');
													$('span#status',row).text(vars.config['statusdenyvalue']);
												}
											}
										});
									});
								},function(error){
									swal('Error!',error.message,'error');
								});
							})
						)
						.append($('<input type="hidden" id="id">').val(cars[i].records[i2]['$id'].value))
					);
				}
			}
			$('.count',container).text(records.length.toString()+'台');
			$('.user',container).off('click').on('click',function(e){
				$('.cars',container).toggle('fast');
			});
			if (callback) callback();
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check viewid */
		if (event.viewId!=vars.config['allocationview']) return;
		/* initialize valiable */
		vars.offset=0;
		vars.records=[];
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			vars.allocationcolors=JSON.parse(vars.config['allocationcolors']);
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
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check device */
		vars.ismobile=event.type.match(/mobile/g);
		/* hide elements  */
		var excludeusers=JSON.parse(vars.config['excludeuser']);
		var excludeorganizations=JSON.parse(vars.config['excludeorganization']);
		var spacer=$(kintone.app.record.getSpaceElement(vars.config['spacer']));
		kintone.api(kintone.api.url('/v1/user/organizations',true),'GET',{code:kintone.getLoginUser().code},function(resp){
			for (var i=0;i<resp.organizationTitles.length;i++)
				if (excludeorganizations.indexOf(resp.organizationTitles[i].organization.code)>-1) spacer.closest('.control-spacer-field-gaia').hide();
			if (excludeusers.indexOf(kintone.getLoginUser().code)>-1) spacer.closest('.control-spacer-field-gaia').hide();
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
			vars.latlngmap=$('body').routemap(vars.config['apikey'],function(){
				/* the initial display when editing */
				if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record[vars.config['lat']].value+','+event.record[vars.config['lng']].value});
				if (!vars.ismobile) spacer.append(vars.map);
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
			},$('script#mapscript').size());
		},function(error){});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
