/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-route"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* parameters
* apiikey	:google api key
* -------------------------------------------------------------------
*/
var RouteMap=function(options){
	var options=$.extend({
		apiikey:'',
		container:null,
		isfullscreen:true,
		needroute:true,
		loadedcallback:null,
		isreload:false
	},options);
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'position':'relative'
	});
	/* keep parameters */
	this.isfullscreen=options.isfullscreen;
	this.needroute=options.needroute;
	this.loadedcallback=options.loadedcallback;
	/* loading wait */
	var waitgoogle=function(callback){
		setTimeout(function(){
			if (typeof(google)=='undefined') waitgoogle(callback);
			else callback();
		},1000);
	};
	/* append elements */
	this.container=div.clone(true).css({
		'background-color':'#FFFFFF',
		'height':'100%',
		'width':'100%'
	}).attr('id','mapcontainer');
	if (this.isfullscreen)
	{
		this.container.css({
			'bottom':'-100%',
			'height':'100vh',
			'left':'0px',
			'position':'fixed',
			'width':'100vw',
			'z-index':'999999'
		});
	}
	this.contents=div.clone(true).css({
		'height':'100%',
		'left':'0px',
		'position':'absolute',
		'top':'0px',
		'width':'100%',
		'z-index':'1'
	}).attr('id','mapcontents');
	this.buttonblock=div.clone(true).css({
		'background-color':'transparent',
		'display':'inline-block',
		'padding':'5px',
		'position':'absolute',
		'right':'0px',
		'text-align':'right',
		'top':'0px',
		'white-space':'nowrap',
		'width':'auto',
		'z-index':'2'
	}).append(
		$('<button id="mapclose">')
		.css({
			'background-color':'transparent',
			'border':'none',
			'height':'48px',
			'width':'48px'
		})
		.on('click',function(){
			my.container.css({'bottom':'-100%'});
		})
		.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.svg" alt="閉じる" title="閉じる" />').css({'width':'100%'}))
	);
	this.container.append(this.contents);
	if (this.isfullscreen) this.container.append(this.buttonblock);
	if (options.container!=null) options.container.append(this.container);
	/* setup google map */
	if (!options.isreload)
	{
		var api=$('<script>');
		api.attr('type','text/javascript');
		api.attr('src','https://maps.googleapis.com/maps/api/js?key='+options.apiikey);
		$('head').append(api);
	}
	/* setup map */
	this.colors=$.markercolors();
	this.currentlatlng=null;
	this.watchId=null;
	this.markers=[];
	this.balloons=[];
	this.map=null;
	this.directionsRenderer=null;
	this.directionsService=null;
	/* loading wait */
	if (options.container!=null) waitgoogle(function(){
		var latlng=new google.maps.LatLng(0,0);
		var param={
			center:latlng,
			fullscreenControl:true,
			fullscreenControlOptions:{position:google.maps.ControlPosition.BOTTOM_LEFT},
			gestureHandling:((my.isfullscreen)?'greedy':'auto'),
			mapTypeControl:false,
			overviewMapControl:false,
			panControl:true,
			scaleControl:false,
			streetViewControl:true,
			zoomControl:true,
			zoom:14
		};
		my.map=new google.maps.Map(document.getElementById(my.contents.attr('id')),param);
		my.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
		my.directionsService=new google.maps.DirectionsService();
		if (my.loadedcallback!=null) my.loadedcallback();
	});
};
RouteMap.prototype={
	/* close information widnow */
	closeinfowindow:function(){
		var my=this;
		$.each(this.balloons,function(index){
			my.balloons[index].close();
		});
	},
	/* get currentlocation */
	currentlocation:function(options){
		var options=$.extend({
			callback:null
		},options);
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert('Internet Explorerでは正常に動作しません。\nMicrosoft Edgeかその他のブラウザを利用して下さい。');
			if (this.watchID!=null) options.callback(this.currentlatlng);
			else
			{
				var watchparam={
					accuracy:Number.MAX_SAFE_INTEGER,
					counter:0,
					latlng:null,
					limit:5
				};
				var watch=function(param,callback){
					var watchID=navigator.geolocation.watchPosition(
						function(pos){
							if (param.accuracy>pos.coords.accuracy)
							{
								param.accuracy=pos.coords.accuracy;
								param.latlng=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
							}
							param.counter++;
							if (watchparam.counter>watchparam.limit-1 && callback!=null) callback(param.latlng);
							navigator.geolocation.clearWatch(watchID);
						},
						function(error){
							switch (error.code)
							{
								case 1:
									alert('位置情報取得のアクセスが拒否されました。\n'+error.message);
									break;
								case 2:
									alert('位置情報の取得に失敗しました。\n'+error.message);
									break;
							}
							param.counter++;
							if (param.latlng!=null)
								if (watchparam.counter>watchparam.limit-1 && callback!=null) callback(param.latlng);
							navigator.geolocation.clearWatch(watchID);
						},
						{
							enableHighAccuracy:true,
							maximumAge:0,
							timeout:10000
						}
					);
				};
				for (var i=0;i<watchparam.limit;i++) watch(watchparam,options.callback);
			}
		}
		else {alert('お使いのブラウザでは位置情報が取得出来ません。');}
	},
	watchlocation:function(options){
		var options=$.extend({
			callback:null
		},options);
		var my=this;
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert('Internet Explorerでは正常に動作しません。\nMicrosoft Edgeかその他のブラウザを利用して下さい。');
			this.watchID=navigator.geolocation.watchPosition(
				function(pos){
					my.currentlatlng=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
					if (options.callback!=null) options.callback(my.currentlatlng);
				},
				function(error){
					if (my.currentlatlng==null) my.currentlatlng=new google.maps.LatLng(0,0);
				},
				{
					enableHighAccuracy:true,
					maximumAge:0,
					timeout:10000
				}
			);
		}
		else {alert('お使いのブラウザでは位置情報が取得出来ません。');}
	},
	unwatchlocation:function(){
		if (navigator.geolocation) navigator.geolocation.clearWatch(this.watchID);
		this.watchID=null;
	},
	/* open information widnow */
	openinfowindow:function(){
		var my=this;
		$.each(this.balloons,function(index){
			if (my.markers.length>index) my.balloons[index].open(my.map,my.markers[index]);
		});
	},
	/* reload map */
	reloadmap:function(options){
		var options=$.extend({
			markers:[],
			isextensionindex:false,
			isopeninfowindow:true,
			callback:null
		},options);
		var colors=this.colors;
		var map=this.map;
		var renderer=this.directionsRenderer;
		var service=this.directionsService;
		var serialnumber=0;
		var markers=[];
		var balloons=[];
		/* initialize markers */
		$.each(this.markers,function(index,values){values.setMap(null);});
		this.markers=[];
		markers=this.markers;
		/* initialize balloons */
		$.each(this.balloons,function(index,values){values.setMap(null);});
		this.balloons=[];
		balloons=this.balloons;
		/* initialize renderer */
		renderer.setMap(null);
		var addmarker=function(markeroptions,infowindowoptions){
			/* append markers */
			var markeroptions=$.extend({
				color:0,
				fontsize:11,
				icon:null,
				label:'',
				latlng:new google.maps.LatLng(0,0),
				size:34
			},markeroptions);
			var infowindowoptions=$.extend({
				label:'',
			},infowindowoptions);
			var marker=new google.maps.Marker({
				map:map,
				position:markeroptions.latlng
			});
			if (markeroptions.icon!=null) marker.setIcon(markeroptions.icon);
			else
			{
				marker.setIcon({
					anchor:new google.maps.Point(17,34),
					fillColor:'#'+((markeroptions.color in colors)?colors[markeroptions.color].back:markeroptions.color),
					fillOpacity:1,
					labelOrigin:new google.maps.Point(17,11),
					path:'M26.837,9.837C26.837,17.765,17,19.89,17,34 c0-14.11-9.837-16.235-9.837-24.163C7.163,4.404,11.567,0,17,0C22.432,0,26.837,4.404,26.837,9.837z',
					scale:markeroptions.size/34,
					strokeColor:"#696969",
				});
			}
			if (markeroptions.label.length!=0)
				marker.setLabel({
					color:'#'+((markeroptions.color in colors)?colors[markeroptions.color].fore:'000000'),
					text:markeroptions.label.toString(),
					fontSize:markeroptions.fontsize+'px',
				});
			markers.push(marker);
			/* append balloons */
			if (infowindowoptions.label.length!=0)
			{
				var balloon=new google.maps.InfoWindow({content:infowindowoptions.label,disableAutoPan:true});
				if (options.isopeninfowindow) balloon.open(map,marker);
				google.maps.event.addListener(marker,'click',function(event){
					if (!balloon.getMap()) balloon.open(map,marker);
				});
				balloons.push(balloon);
			}
		};
		switch (options.markers.length)
		{
			case 0:
				break;
			case 1:
				/* append markers */
				var values=$.extend({
					colors:0,
					fontsize:11,
					icon:null,
					label:'',
					lat:0,
					lng:0,
					size:34,
					serialnumber:true,
					extensionindex:''
				},options.markers[0]);
				if (options.isextensionindex) addmarker(
					{
						color:values.colors,
						fontsize:values.fontsize,
						icon:values.icon,
						label:values.extensionindex,
						latlng:new google.maps.LatLng(values.lat,values.lng),
						size:values.size
					},
					{
						label:values.label
					}
				);
				else addmarker(
					{
						color:values.colors,
						fontsize:values.fontsize,
						icon:values.icon,
						label:((values.serialnumber)?'1':''),
						latlng:new google.maps.LatLng(values.lat,values.lng),
						size:values.size
					},
					{
						label:values.label
					}
				);
				/* setup center position */
				map.setCenter(new google.maps.LatLng(values.lat,values.lng));
				if (options.callback!=null) options.callback();
				break;
			default:
				if (this.needroute)
				{
					/* setup routes */
					var origin=null;
					var destination=null;
					var waypoints=[];
					var labels=[];
					$.each(options.markers,function(index,values){
						var values=$.extend({
							label:'',
							lat:0,
							lng:0
						},values);
						switch (index)
						{
							case 0:
								origin=new google.maps.LatLng(values.lat,values.lng);
								break;
							case options.markers.length-1:
								destination=new google.maps.LatLng(values.lat,values.lng);
								break;
							default:
								waypoints.push({
									location:new google.maps.LatLng(values.lat,values.lng),
									stopover:true
								});
								break;
						}
						labels.push((values.label.length!=0)?values.label:'');
					});
					/* setup center position */
					map.setCenter(new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng));
					/* display routes */
					service.route({
						origin:origin,
						destination:destination,
						waypoints:waypoints,
						travelMode:google.maps.TravelMode.DRIVING
					},
					function(result,status){
						if (status==google.maps.DirectionsStatus.OK)
						{
							/* append markers */
							serialnumber=0;
							$.each(options.markers,function(index,values){
								var values=$.extend({
									colors:0,
									fontsize:11,
									icon:null,
									label:'',
									lat:0,
									lng:0,
									size:34,
									serialnumber:true,
									extensionindex:''
								},values);
								if (values.serialnumber) serialnumber++;
								if (options.isextensionindex) addmarker(
									{
										color:values.colors,
										fontsize:values.fontsize,
										icon:values.icon,
										label:values.extensionindex,
										latlng:new google.maps.LatLng(values.lat,values.lng),
										size:values.size
									},
									{
										label:values.label
									}
								);
								else addmarker(
									{
										color:values.colors,
										fontsize:values.fontsize,
										icon:values.icon,
										label:((values.serialnumber)?serialnumber.toString():''),
										latlng:new google.maps.LatLng(values.lat,values.lng),
										size:values.size
									},
									{
										label:values.label
									}
								);
							});
							renderer.setDirections(result);
							renderer.setMap(map);
							if (options.callback!=null) options.callback();
						}
					});
				}
				else
				{
					/* append markers */
					serialnumber=0;
					$.each(options.markers,function(index,values){
						var values=$.extend({
							colors:0,
							fontsize:11,
							icon:null,
							label:'',
							lat:0,
							lng:0,
							size:34,
							serialnumber:true,
							extensionindex:''
						},values);
						if (values.serialnumber) serialnumber++;
						if (options.isextensionindex) addmarker(
							{
								color:values.colors,
								fontsize:values.fontsize,
								icon:values.icon,
								label:values.extensionindex,
								latlng:new google.maps.LatLng(values.lat,values.lng),
								size:values.size
							},
							{
								label:values.label
							}
						);
						else addmarker(
							{
								color:values.colors,
								fontsize:values.fontsize,
								icon:values.icon,
								label:((values.serialnumber)?serialnumber.toString():''),
								latlng:new google.maps.LatLng(values.lat,values.lng),
								size:values.size
							},
							{
								label:values.label
							}
						);
					});
					/* setup center position */
					map.setCenter(new google.maps.LatLng(options.markers[0].lat,options.markers[0].lng));
					if (options.callback!=null) options.callback();
				}
				break;
		}
		if (this.isfullscreen) this.container.css({'bottom':'0px'});
	}
};
jQuery.extend({
	markercolors:function(){
		return [
			{name:'レッド',back:'e60012',fore:'000000'},
			{name:'臙脂',back:'e5171f',fore:'000000'},
			{name:'紅梅',back:'e44d93',fore:'000000'},
			{name:'ローズ',back:'e85298',fore:'000000'},
			{name:'縹',back:'0078ba',fore:'ffffff'},
			{name:'ブルー',back:'0079c2',fore:'ffffff'},
			{name:'セルリアンブルー',back:'00a0de',fore:'000000'},
			{name:'スカイ',back:'00a7db',fore:'000000'},
			{name:'エメラルド',back:'00ada9',fore:'000000'},
			{name:'グリーン',back:'009944',fore:'000000'},
			{name:'緑',back:'019a66',fore:'000000'},
			{name:'リーフ',back:'6cbb5a',fore:'000000'},
			{name:'萌黄',back:'a9cc51',fore:'000000'},
			{name:'ゴールド',back:'d7c447',fore:'000000'},
			{name:'オレンジ',back:'f39700',fore:'000000'},
			{name:'柑子',back:'ee7b1a',fore:'000000'},
			{name:'ブラウン',back:'bb641d',fore:'000000'},
			{name:'マルーン',back:'814721',fore:'ffffff'},
			{name:'ルビー',back:'b6007a',fore:'ffffff'},
			{name:'京紫',back:'522886',fore:'ffffff'},
			{name:'パープル',back:'9b7cb6',fore:'000000'},
			{name:'シルバー',back:'9caeb7',fore:'000000'},
			{name:'ホワイト',back:'ffffff',fore:'000000'},
			{name:'ブラック',back:'000000',fore:'ffffff'}
		];
	}
});
jQuery.fn.routemap=function(apiikey,isfullscreen,needroute,loadedcallback,isreload){
	return new RouteMap({
		apiikey:apiikey,
		container:this,
		isfullscreen:(isfullscreen===undefined)?true:isfullscreen,
		needroute:(needroute===undefined)?true:needroute,
		loadedcallback:(loadedcallback===undefined)?null:loadedcallback,
		isreload:(isreload===undefined)?false:isreload
	});
};
})(jQuery);
