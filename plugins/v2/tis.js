/*
* TIS-Plugin "tis.js"
* Version: 1.0
* Copyright (c) 2018 TIS
* Released under the MIT License.
* http://tis2010.jp/license.txt
*/
"use strict";
class tislibrary{
	/* constructor */
	constructor(){
		/* setup properties */
		this.window={
			alert:null,
			loader:null,
			addresspicker:null,
			coloradjuster:null,
			colorpicker:null,
			datepicker:null,
			multipicker:null,
			recordpicker:null,
			panelizer:null
		}
	}
	/* show coloradjuster */
	adjustcolor(color,callback){
		this.window.coloradjuster.show(color,callback);
	}
	/* show alert */
	alert(message,callback){
		this.loadend();
		this.window.alert.alert(message,callback);
	}
	/* assign record */
	assignrecord(container,group,record){
		container.elms('[data-group='+group+']').some((item,index) => {
			var hasid=item.hasAttribute('id');
			var hasname=item.hasAttribute('name');
			var assignvalue=(item,value) => {
				if (item.hasAttribute('data-padding'))
				{
					var param=item.attr('data-padding').split(':');
					if (param.length==3)
					{
						if (value===undefined || value===null) value='';
						if (param[2]=='L') value=value.toString().lpad(param[0],param[1]);
						else  value=value.toString().rpad(param[0],param[1]);
					}
				}
				if (item.hasAttribute('data-type'))
				{
					switch (item.attr('data-type'))
					{
						case 'date':
						case 'datetime':
							if (value) value=value;
							break;
						case 'number':
							if (tis.isnumeric(value))
								value=Number(value).comma(item.attr('data-digit'));
							break;
						case 'postalcode':
							if (value)
							{
								var postalcode=value.replace(/[^0-9]+/g,'');
								if (postalcode.length==7) value=postalcode.substr(0,3)+'-'+postalcode.substr(3,4);
							}
							break;
					}
				}
				switch (item.tagName.toLowerCase())
				{
					case 'p':
					case 'span':
						item.html(value);
						break;
					default:
						item.val(value);
						break;
				}
			};
			/* setup elements */
			switch (item.tagName.toLowerCase())
			{
				case 'input':
					switch (item.type.toLowerCase())
					{
						case 'checkbox':
							if (hasid)
								if (item.attr('id') in record)
									item.checked=(record[item.attr('id')]=='1')?true:false;
							break;
						case 'radio':
							if (hasname)
								if (item.attr('name') in record)
									container.elms('[name='+item.attr('name')+']').some((item,index) => {
										if (record[item.attr('name')]==item.val()) item.checked=true;
									});
							break;
						default:
							if (hasid)
								if (item.attr('id') in record) assignvalue(item,record[item.attr('id')]);
							break;
					}
					break;
				default:
					if (hasid)
						if (item.attr('id') in record) assignvalue(item,record[item.attr('id')]);
					break;
			}
		});
	}
	/* build record */
	buildrecord(container,group){
		var res={
			error:false,
			record:{}
		};
		container.elms('[data-group='+group+']').some((item,index) => {
			var hasid=item.hasAttribute('id');
			var hasname=item.hasAttribute('name');
			/* validation */
			switch (item.tagName.toLowerCase())
			{
				case 'p':
				case 'span':
					break;
				default:
					if (!item.checkValidity()) res.error=true;
					break;
			}
			if (!res.error)
			{
				/* setup record */
				switch (item.tagName.toLowerCase())
				{
					case 'input':
						switch (item.type.toLowerCase())
						{
							case 'checkbox':
								if (hasid) res.record[item.attr('id')]=(item.checked)?'1':'0';
								break;
							case 'radio':
								if (hasname)
									container.elms('[name='+item.attr('name')+']').some((item,index) => {
										if (item.checked) res.record[item.attr('name')]=item.val();
									});
								break;
							default:
								if (hasid) res.record[item.attr('id')]=item.val();
								break;
						}
						break;
					case 'p':
					case 'span':
						break;
					default:
						if (hasid) res.record[item.attr('id')]=item.val();
						break;
				}
			}
		});
		if (res.error) this.alert('入力内容に誤りがあります');
		return res;
	}
	/* calculate tax */
	calculatetax(normal,reduced,free,date,outside,taxround){
		var freeprice=0;
		var normalprice=0;
		var normaltax=0;
		var reducedprice=0;
		var reducedtax=0;
		var taxrate=this.taxrate(date);
		if (outside)
		{
			//outside
			switch (taxround)
			{
				case 'floor':
					normalprice=Math.floor(normal*(1+taxrate.normalrate));
					normaltax=Math.floor((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.floor(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.floor((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'ceil':
					normalprice=Math.ceil(normal*(1+taxrate.normalrate));
					normaltax=Math.ceil((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.ceil(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.ceil((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'round':
					normalprice=Math.round(normal*(1+taxrate.normalrate));
					normaltax=Math.round((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.round(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.round((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
			}
		}
		else
		{
			//inside
			switch (taxround)
			{
				case 'floor':
					normalprice=Math.floor(normal);
					normaltax=Math.floor((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.floor(reduced);
					reducedtax=Math.floor((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'ceil':
					normalprice=Math.ceil(normal);
					normaltax=Math.ceil((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.ceil(reduced);
					reducedtax=Math.ceil((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'round':
					normalprice=Math.round(normal);
					normaltax=Math.round((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.round(reduced);
					reducedtax=Math.round((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
			}
		}
		switch (taxround)
		{
			case 'floor':
				freeprice=Math.floor(free);
				break;
			case 'ceil':
				freeprice=Math.ceil(free);
				break;
			case 'round':
				freeprice=Math.round(free);
				break;
		}
		return {
			subtotal:normalprice-normaltax+reducedprice-reducedtax+freeprice,
			tax:normaltax+reducedtax,
			total:normalprice+reducedprice+freeprice,
			normaltotal:normalprice-normaltax+freeprice,
			reducedtotal:reducedprice-reducedtax,
			normaltax:normaltax,
			reducedtax:reducedtax
		}
	}
	/* show confirm */
	confirm(message,callback){
		this.loadend();
		this.window.alert.confirm(message,callback);
	}
	/* create element */
	create(tagname){
		return document.createElement(tagname);
	}
	/* check device */
	device(){
		var ua=navigator.userAgent;
		if (ua.indexOf('iPhone')>0 || ua.indexOf('iPod')>0 || ua.indexOf('Android')>0 && ua.indexOf('Mobile')>0 || ua.indexOf('Windows Phone')>0) return 'sp';
		if (ua.indexOf('iPad')>0 || ua.indexOf('Android')>0) return 'tab';
		return 'other';
	}
	/* get elements */
	elm(selectors){
		return document.querySelector(selectors);
	}
	elms(selectors){
		return Array.from(document.querySelectorAll(selectors));
	}
	/* send file request */
	file(url,method,headers,body,silent=false){
		return new Promise((resolve,reject) => {
			var filedata=new FormData();
			var xhr=new XMLHttpRequest();
			var param=[];
			switch (method)
			{
				case 'GET':
					if ('name' in body) param.push('name='+body.name);
					if ('dir' in body) param.push('dir='+body.dir);
					break;
				case 'POST':
					param.push('name='+(('name' in body)?body.name:'file'));
					if ('dir' in body) param.push('dir='+body.dir);
					if ('files' in body)
						for (var i=0;i<body.files.length;i++)
						{
							var blob=new Blob([body.files[i]],{type:body.files[i].type});
							filedata.append('file[]',blob,body.files[i].name);
						}
					break;
			}
			if (param.length!=0) url+='?'+param.join('&');
			xhr.open(method,url,true);
			for (var key in headers) xhr.setRequestHeader(key,headers[key]);
			xhr.onload=(e) => {
				if (!silent) this.loadend();
				switch (e.currentTarget.status)
				{
					case 200:
						resolve(e.currentTarget.response);
						break;
					default:
						reject({message:e.currentTarget.responseText,status:e.currentTarget.status});
						break;
				}
			}
			xhr.onerror=(e) => {
				var message=(e.currentTarget.responseText)?e.currentTarget.responseText:'The requested URL '+url+' was not found.';
				if (!silent) this.loadend();
				reject({message:message,status:e.currentTarget.status});
			}
			if (!silent) this.loadstart();
			if (method=='POST') xhr.send(filedata);
			else
			{
				if (typeof body!=='string') xhr.send(JSON.stringify(body));
				else xhr.send(body);
			}
		});
	}
	/* create graph */
	graph(canvas,type,scale,captions,styles,values){
		return new tisgraph(canvas,type,scale,captions,styles,values);
	}
	/* check number */
	isnumeric(value){
		if (typeof value==='string') return value.match(/^-?[0-9]+(\.[0-9]+)*$/g);
		if (typeof value==='number') return true;
		return false;
	}
	/* hide loader */
	loadend(){
		this.window.loader.hide();
	}
	/* show loader */
	loadstart(){
		this.window.loader.show();
	}
	/* show panelizer */
	panelize(elements){
		this.window.panelizer.show(elements);
	}
	/* show addresspicker */
	pickupaddress(prefecture,city,callback){
		this.window.addresspicker.show(prefecture,city,callback);
	}
	/* show colorpicker */
	pickupcolor(callback){
		this.window.colorpicker.show(callback);
	}
	/* show datepicker */
	pickupdate(activedate,callback){
		this.window.datepicker.show(activedate,callback);
	}
	/* show multipicker */
	pickupmultiple(records,columninfos,callback){
		this.window.multipicker.show(records,columninfos,callback);
	}
	/* show recordpicker */
	pickuprecord(records,columninfos,callback){
		this.window.recordpicker.show(records,columninfos,callback);
	}
	/* get query strings */
	queries(){
		var res={};
		var searches=decodeURI(window.location.search).split('?');
		if (searches.length>1)
		{
			searches=searches.last().replace(/#.*$/g,'').split('&');
			for(var i=0;i<searches.length;i++)
			{
				var search=searches[i].split('=');
				res[search[0]]=search[1];
			}
		}
		return res;
	}
	/* document loaded */
	ready(callback){
		document.on('DOMContentLoaded',(e) => {
			if (!this.window.alert)
			{
				/* setup properties */
				this.window.panelizer=new tispanelizer();
				this.window.recordpicker=new tisrecordpicker();
				this.window.multipicker=new tismultipicker();
				this.window.datepicker=new tisdatepicker();
				this.window.colorpicker=new tiscolorpicker();
				this.window.coloradjuster=new tiscoloradjuster();
				this.window.addresspicker=new tisaddresspicker();
				this.window.loader=new tisloader();
				this.window.alert=new tisalert();
				/* setup validation method */
				tis.elms('input,select,textarea').some((item,index) => {
					item.initialize();
				});
				/* create map */
				this.map=new tismap();
			}
			if (callback) callback(this);
		});
	}
	/* send request */
	request(url,method,headers,body,silent=false,addcontenttype=true){
		return new Promise((resolve,reject) => {
			var xhr=new XMLHttpRequest();
			var param=[];
			if (method=='GET')
			{
				for (var key in body)
				{
					if (body[key] instanceof Object) param.push(key+'='+JSON.stringify(body[key]));
					else param.push(key+'='+body[key]);
				}
			}
			if (param.length!=0) url+='?'+param.join('&');
			xhr.open(method,url,true);
			for (var key in headers) xhr.setRequestHeader(key,headers[key]);
			if (addcontenttype)
				if (!('Content-Type' in headers)) xhr.setRequestHeader('Content-Type','application/json');
			xhr.onload=(e) => {
				if (!silent) this.loadend();
				switch (e.currentTarget.status)
				{
					case 200:
						resolve(e.currentTarget.response);
						break;
					default:
						reject({message:e.currentTarget.responseText,status:e.currentTarget.status});
						break;
				}
			}
			xhr.onerror=(e) => {
				var message=(e.currentTarget.responseText)?e.currentTarget.responseText:'The requested URL '+url+' was not found.';
				if (!silent) this.loadend();
				reject({message:message,status:e.currentTarget.status});
			}
			if (!silent) this.loadstart();
			if (typeof body!=='string') xhr.send(JSON.stringify(body));
			else xhr.send(body);
		});
	}
	/* get tax rate */
	taxrate(date){
		var tax=[
			{startdate:'1900-01-01',normalrate:0,reducedrate:0},
			{startdate:'1989-04-01',normalrate:0.03,reducedrate:0.03},
			{startdate:'1997-04-01',normalrate:0.05,reducedrate:0.05},
			{startdate:'2014-04-01',normalrate:0.08,reducedrate:0.08},
			{startdate:'2019-10-01',normalrate:0.1,reducedrate:0.08}
		];
		var res={};
		var today=new Date().format('Y/m/d');
		for (var i=0;i<tax.length;i++) if (new Date(tax[i].startdate.replace(/-/g,'\/'))<new Date((date)?date.replace(/-/g,'\/'):today)) res=tax[i];
		return res;
	}
	/* scroll to pagetop */
	scrollTop(duration){
		var counter=0;
		var keep=performance.now();
		var param=window.scrollY/2;
		var step=(timestamp) => {
			counter+=Math.PI/(duration/(timestamp - keep));
			if (counter>=Math.PI) window.scrollTo(0,0);
			if (window.scrollY===0) return;
			window.scrollTo(0,Math.round(param+param*Math.cos(counter)));
			keep=timestamp;
			window.requestAnimationFrame(step);
		}
		window.requestAnimationFrame(step);
	}
};
class tisalert{
	/* constructor */
	constructor(){
		var button=tis.create('button');
		var div=tis.create('div');
		var active=(e) => e.currentTarget.css({fontWeight:'bold'});
		var passive=(e) => e.currentTarget.css({fontWeight:'normal'});
		/* initialize valiable */
		button.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			color:'#42a5f5',
			cursor:'pointer',
			display:'inline-block',
			fontSize:'1em',
			lineHeight:'2.5em',
			margin:'0px',
			outline:'none',
			padding:'0px 0.5em',
			position:'relative',
			textAlign:'center',
			verticalAlign:'top'
		});
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.listener=null;
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999999'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			minWidth:'10em',
			padding:'1em 0px 3.5em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)'
		});
		this.contents=div.clone().css({
			lineHeight:'1.5em',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px 1em',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderTop:'1px solid #42a5f5',
			bottom:'0px',
			left:'0px',
			position:'absolute',
			width:'100%'
		});
		this.ok=button.clone().html('OK')
		.on('mouseover',active)
		.on('mouseout',passive)
		.on('focus',active)
		.on('blur',passive);
		this.cancel=button.clone().html('Cancel')
		.on('mouseover',active)
		.on('mouseout',passive)
		.on('focus',active)
		.on('blur',passive)
		.on('click',(e) => this.cover.css({display:'none'}));
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.ok)
					.append(this.cancel)
				)
			)
		);
		/* resize event */
		window.on('resize',(e) => {
			this.contents
			.css({height:'auto'})
			.css({height:this.container.innerheight().toString()+'px'});
		});
	}
	/* show alert */
	alert(message,callback){
		/* setup listener */
		if (this.listener) this.ok.off('click',this.listener);
		this.listener=(e) => {
			this.cover.css({display:'none'});
			if (callback) callback();
		};
		this.ok.on('click',this.listener);
		/* setup styles */
		this.ok.css({
			borderRight:'none',
			width:'100%'
		});
		this.cancel.css({display:'none'});
		/* setup message */
		if (message.nodeName) this.contents.append(message);
		else this.contents.html(message);
		/* show */
		this.cover.css({display:'block'});
		this.contents
		.css({height:'auto'})
		.css({height:this.container.innerheight().toString()+'px'});
		this.ok.focus();
	}
	/* show confirm */
	confirm(message,callback){
		/* setup listener */
		if (this.listener) this.ok.off('click',this.listener);
		this.listener=(e) => {
			this.cover.css({display:'none'});
			if (callback) callback();
		};
		this.ok.on('click',this.listener);
		/* setup styles */
		this.ok.css({
			borderRight:'1px solid #42a5f5',
			width:'50%'
		});
		this.cancel.css({
			display:'inline-block',
			width:'50%'
		});
		/* setup message */
		if (message.nodeName) this.contents.append(message);
		else this.contents.html(message);
		/* show */
		this.cover.css({display:'block'});
		this.contents
		.css({height:'auto'})
		.css({height:this.container.innerheight().toString()+'px'});
		this.ok.focus();
	}
};
class tisaddresspicker{
	/* constructor */
	constructor(){
		var div=tis.create('div');
		var select=tis.create('select');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		select.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'1em',
			height:'2em',
			lineHeight:'2em',
			margin:'0px',
			outline:'none',
			padding:'0px 2.5em 0px 0.5em',
			position:'relative',
			verticalAlign:'top',
			width:'100%',
			appearance:'none',
			mozAppearance:'none',
			webkitAppearance:'none'
		})
		/* setup properties */
		this.table=null;
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc(33.5em + 16px)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'calc(5em + 1px) 0px 0.5em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)',
			width:'20em'
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderBottom:'1px solid #42a5f5',
			left:'0px',
			padding:'0.25em 0px',
			position:'absolute',
			top:'0px',
			width:'100%'
		});
		this.close=tis.create('img').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			right:'0.25em',
			top:'0.25em',
			width:'2em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		this.prefecture=select.clone()
		.on('change',(e) => this.pickupcity(this.prefecture.val()));
		this.city=select.clone()
		.on('change',(e) => this.pickupstreet(this.prefecture.val(),this.city.val()));
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.prefecture)
					.append(
						div.clone().css({
							backgroundColor:'#42a5f5',
							height:'1px',
							margin:'0.25em 0px',
							padding:'0px',
							width:'100%'
						})
					)
					.append(this.city)
					.append(this.close)
				)
			)
		);
	}
	/* search prefecture */
	pickupprefecture(callback){
		/* initialize elements */
		this.prefecture.empty()
		.append(
			tis.create('option')
			.attr('value','')
			.html('都道府県を選択')
		);
		this.city.empty()
		.append(
			tis.create('option')
			.attr('value','')
			.html('市区町村を選択')
		);
		if (this.table) this.table.clearrows();
		/* setup elements */
		tis.request('https://tis2010.jp/service/api/place/prefecture','GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
		.then((resp) => {
			var records=JSON.parse(resp).records;
			this.prefecture.assignoption(records,'name','id');
			if (callback) callback(records);
		})
		.catch((error) => tis.alert(error.message));
	}
	/* search city */
	pickupcity(prefecture,callback){
		/* initialize elements */
		this.city.empty()
		.append(
			tis.create('option')
			.attr('value','')
			.html('市区町村を選択')
		);
		if (this.table) this.table.clearrows();
		/* setup elements */
		if (prefecture)
		{
			tis.request('https://tis2010.jp/service/api/place/city?prefecture='+prefecture,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
			.then((resp) => {
				var records=JSON.parse(resp).records;
				this.city.assignoption(records,'name','id');
				if (callback) callback(records);
			})
			.catch((error) => tis.alert(error.message));
		}
		else
		{
			if (callback) callback();
		}
	}
	/* search street */
	pickupstreet(prefecture,city,callback){
		/* initialize elements */
		if (this.table) this.table.clearrows();
		/* setup elements */
		if (prefecture && city)
		{
			tis.request('https://tis2010.jp/service/api/place/street?prefecture='+prefecture+'&city='+city,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
			.then((resp) => {
				var records=JSON.parse(resp).records;
				/* append records */
				if (this.table)
					for (var i=0;i<records.length;i++)
						this.table.addrow().elm('td').attr('id',records[i].id).html((records[i].name)?records[i].name:'&nbsp;');
				if (callback) callback(records);
			})
			.catch((error) => tis.alert(error.message));
		}
		else
		{
			if (callback) callback();
		}
	}
	/* search postalcode */
	pickupzip(zip,callback){
		tis.request('https://tis2010.jp/service/api/place/zip?search='+zip,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
		.then((resp) => {
			if (callback) callback(JSON.parse(resp).records[0]);
		})
		.catch((error) => tis.alert(error.message));
	}
	/* show records */
	show(prefecture,city,callback){
		/* create table */
		this.table=tis.create('table').css({
			borderCollapse:'collapse',
			width:'100%'
		})
		.append(
			tis.create('tbody').append(
				tis.create('tr')
				.append(
					tis.create('td').css({
						border:'none',
						borderBottom:'1px solid #42a5f5',
						boxSizing:'border-box',
						cursor:'pointer',
						lineHeight:'1.5em',
						margin:'0px',
						padding:'0.25em 0.5em',
						textAlign:'left'
					})
				)
			)
		);
		this.contents.empty().append(
			this.table.spread((row,index) => {
				row.on('click',(e) => {
					var zip=e.currentTarget.elm('td').attr('id');
					if (callback) callback({
						prefecture:{
							id:this.prefecture.val(),
							name:this.prefecture.selectedtext()
						},
						city:{
							id:this.city.val(),
							name:this.city.selectedtext()
						},
						street:{
							id:zip,
							name:e.currentTarget.elm('td').text().replace(/ $/g,'')
						},
						address:this.prefecture.selectedtext()+this.city.selectedtext()+e.currentTarget.elm('td').text().replace(/ $/g,''),
						zip:((zip.length==7)?zip.substr(0,3)+'-'+zip.substr(3,4):zip)
					});
					this.hide();
				});
			})
		);
		/* setup elements */
		this.pickupprefecture(() => {
			if (prefecture) this.prefecture.val(prefecture);
		});
		this.pickupcity(prefecture,() => {
			if (city) this.city.val(city);
		});
		this.pickupstreet(prefecture,city,() => {
			/* show */
			this.cover.css({display:'block'})
		});
	}
	/* hide records */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tiscoloradjuster{
	/* constructor */
	constructor(){
		var canvas=tis.create('canvas');
		var div=tis.create('div');
		var img=tis.create('img');
		var span=tis.create('span');
		var listener=(e) => {
			var iscanvas=false;
			var rect={
				clip:null,
				container:null
			};
			if (e.currentTarget==this.hue.clip) this.params.target='hue';
			if (e.currentTarget==this.saturation.clip) this.params.target='saturation';
			if (e.currentTarget==this.brightness.clip) this.params.target='brightness';
			if (e.currentTarget==this.hue.canvas) {this.params.target='hue';iscanvas=true;}
			if (e.currentTarget==this.saturation.canvas) {this.params.target='saturation';iscanvas=true;}
			if (e.currentTarget==this.brightness.canvas) {this.params.target='brightness';iscanvas=true;}
			switch(this.params.target)
			{
				case 'hue':
					this.params.clip=this.hue.clip;
					this.params.canvas=this.hue.canvas;
					this.params.container=this.hue.container;
					break;
				case 'saturation':
					this.params.clip=this.saturation.clip;
					this.params.canvas=this.saturation.canvas;
					this.params.container=this.saturation.container;
					break;
				case 'brightness':
					this.params.clip=this.brightness.clip;
					this.params.canvas=this.brightness.canvas;
					this.params.container=this.brightness.container;
					break;
			}
			rect.clip=this.params.clip.getBoundingClientRect();
			rect.container=this.params.container.getBoundingClientRect();
			this.params.keep=e.pageX;
			if (iscanvas)
			{
				this.params.down=e.pageX-rect.container.left;
				this.params.clip.css({'left':this.params.down.toString()+'px'});
			}
			else this.params.down=rect.clip.left+rect.clip.width/2-rect.container.left;
			this.capture=true;
			/* adjust volume */
			this.adjustvolume();
			e.stopPropagation();
			e.preventDefault();
		};
		/* initialize valiable */
		canvas.css({
			borderRadius:'0.25em',
			boxSizing:'border-box',
			cursor:'crosshair',
			display:'none',
			margin:'0px',
			position:'relative',
			verticalAlign:'top'
		});
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		img.css({
			backgroundColor:'transparent',
			border:'none',
			bottom:'0px',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'0.75em',
			left:'4em',
			margin:'0px 0px 0px -0.5em',
			position:'absolute',
			transition:'none',
			width:'1em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAtCAYAAAGFcTjaAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAm1JREFUeNpiYCAFTJgy8TwQ/0cWY0JTYwBV+B9DAbpOFAUgo7FY9x/ZBAMcbvoPEEAk+eA/EAvgc9x7XF5DUciIx3JBRnyuAgggYhyIUzMjPo3I/IKcfEaCmqGhboDDTEGgIR+waibWfzBXMJIXXRADGAk4Ey8ACCBCod2PT54Jj0aQawrI0gwE5wmFBRMxcYzL+Uw4nIsRuMTafJ7YnMdESiJBdz4TAefidT4TIeficz4TOUkT5nwmIp2L1flMxDoXm/MBAoiRgnQPy1AoeZxYwESui5Fy8XtCmY+k4g9PJj1PqHCiqsUklFVEBT0TGUFLCBAV9IyUBC2x9QKpVRy1qgGsQc9EhaAlK+gZqRm0pAQ9Iw2Clvj2ANmNJPJBI0AA4uvmBkAQhgKwvkkcwRHcDDZjBTfoKv4kJh4IFNtXOXkxj35gUy2jQrYkw/BuOsMlNPh1NMv5vIUEV4hLVMWpshmhBjdu/zA5HG9xYVWcFJsT1+CBBqMmB6FRFK+K04dPTkzBhh7eJQerF/fI4Uk8Qg5nYjU5CMQqcjCINeQgEXfJQSRukoNJ3CIHmbhGvj5/5nmKXffcPv8w2l5rPwToxu5uAARhIADnGhdiBDdjMx3BERxF4iMxIj89WpvwTC79EmgX9o3ZtLKmD/7OvF/IYWM2mm0tW4yeAjHs20h4phNadkfmAlcO3OrEhUy4+IhoE8ckwqVSI47JhOnEZTJhOnEYIUwjDmOE1YmLMcLqxGGUsBpxGCc8nLgYJzycOJwQHkYczgh3ExdnhLuJwynhZuJwTriauDgn/IV4fOywc8KlOlKnwx34Z4RLFS4eo2RZccIohAAAAABJRU5ErkJggg==');
		span.css({
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'0.8em',
			lineHeight:'1.875em',
			margin:'0px',
			padding:'0px 1.25em 0px 0px',
			position:'relative',
			verticalAlign:'top',
			width:'3.75em'
		});
		/* setup properties */
		this.capture=false;
		this.callback=null;
		this.params={
			target:'',
			down:0,
			keep:0,
			clip:null,
			canvas:null,
			container:null
		};
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'22.75em',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'2em 0px 0px 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)',
			width:'600px'
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px',
			textAlign:'center',
			width:'100%'
		});
		this.close=tis.create('img').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			right:'0px',
			top:'0px',
			width:'2em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		this.informations=div.clone().css({
			border:'1px solid #9e9e9e',
			borderRadius:'0.25em',
			display:'inline-block',
			lineHeight:'1.5em',
			margin:'0px 0px 1em 4em',
			padding:'1em',
			verticalAlign:'top',
			width:'calc(50% - 4em)'
		});
		this.thumbnail=div.clone().css({
			borderRadius:'0.25em',
			display:'inline-block',
			height:'8em',
			margin:'0px 10% 1em 10%',
			verticalAlign:'top',
			width:'30%'
		});
		this.hex=tis.create('input').css({
			backgroundColor:'transparent',
			border:'1px solid #9e9e9e',
			borderRadius:'0.25em',
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'0.8em',
			height:'1.5625em',
			lineHeight:'1.5625em',
			margin:'0.125em 0px',
			outline:'none',
			padding:'0px 0.25em',
			position:'relative',
			verticalAlign:'top',
			width:'calc(100% - 3.75em)'
		})
		.attr('type','text')
		.on('change',(e) => {
			var color=e.currentTarget.val().replace(/#/g,'');
			if (color.length==6)
			{
				/* convert HSB color */
				this.toHSB(color)
				/* attach volume */
				this.attachvolume();
				if (this.callback) this.callback('#'+color);
			}
		});
		/* setup hue properties */
		this.hue={
			caption:span.clone().html('色相'),
			display:span.clone().css({width:'calc(100% - 3.75em)'}),
			clip:img.clone().on('touchstart,mousedown',listener),
			canvas:canvas.clone().on('touchstart,mousedown',listener),
			container:div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			max:359,
			volume:0
		};
		/* setup saturation properties */
		this.saturation={
			caption:span.clone().html('彩度'),
			display:span.clone().css({width:'calc(100% - 3.75em)'}),
			clip:img.clone().on('touchstart,mousedown',listener),
			canvas:canvas.clone().on('touchstart,mousedown',listener),
			container:div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			max:100,
			volume:0
		};
		/* setup brightness properties */
		this.brightness={
			caption:span.clone().html('明度'),
			display:span.clone().css({width:'calc(100% - 3.75em)'}),
			clip:img.clone().on('touchstart,mousedown',listener),
			canvas:canvas.clone().on('touchstart,mousedown',listener),
			container:div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			max:100,
			volume:0
		};
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(
					this.contents
					.append(this.informations
							.append(span.clone().html('色相'))
							.append(this.hue.display.css({padding:'0px',textAlign:'left'}))
							.append(span.clone().html('彩度'))
							.append(this.saturation.display.css({padding:'0px',textAlign:'left'}))
							.append(span.clone().html('明度'))
							.append(this.brightness.display.css({padding:'0px',textAlign:'left'}))
							.append(span.clone().html('#'))
							.append(this.hex)
						)
						.append(this.thumbnail)
						.append(
							this.hue.container
							.append(this.hue.caption)
							.append(this.hue.canvas)
							.append(this.hue.clip)
						)
						.append(
							this.saturation.container
							.append(this.saturation.caption)
							.append(this.saturation.canvas)
							.append(this.saturation.clip)
						)
						.append(
							this.brightness.container
							.append(this.brightness.caption)
							.append(this.brightness.canvas)
							.append(this.brightness.clip)
						)
				)
				.append(this.close)
			)
		);
		/* mouse event */
		window.on('touchmove,mousemove',(e) => {
			if (!this.capture) return;
			var position=e.pageX+this.params.down-this.params.keep;
			var rect={
				canvas:this.params.canvas.getBoundingClientRect(),
				container:this.params.container.getBoundingClientRect()
			};
			if (e.pageX<rect.canvas.left) position=rect.canvas.left-rect.container.left;
			if (e.pageX>rect.canvas.right) position=rect.canvas.right-rect.container.left;
			this.params.clip.css({'left':position.toString()+'px'});
			/* adjust volume */
			this.adjustvolume();
			e.stopPropagation();
			e.preventDefault();
		});
		window.on('touchend,mouseup',(e) => {
			if (!this.capture) return;
			this.capture=false;
			e.stopPropagation();
			e.preventDefault();
		});
		/* resize event */
		window.on('resize',(e) => {
			/* attach volume */
			this.attachvolume();
		});
	}
	/* adjust volume */
	adjustvolume(){
		var position=parseInt(this.params.clip.css('left'));
		var rect={
			canvas:this.params.canvas.getBoundingClientRect(),
			container:this.params.container.getBoundingClientRect()
		};
		position-=rect.canvas.left-rect.container.left;
		switch(this.params.target)
		{
			case 'hue':
				this.hue.volume=Math.ceil((position/rect.canvas.width)*this.hue.max);
				break;
			case 'saturation':
				this.saturation.volume=Math.ceil((position/rect.canvas.width)*this.saturation.max);
				break;
			case 'brightness':
				this.brightness.volume=Math.ceil((position/rect.canvas.width)*this.brightness.max);
				break;
		}
		/* draw canvas */
		this.redraw();
		/* convert HEX color */
		this.toHEX();
		if (this.callback) this.callback('#'+this.hex.val());
	}
	/* attach volume */
	attachvolume(){
		var volumes=[this.hue,this.saturation,this.brightness];
		/* draw canvas */
		this.redraw();
		for (var i=0;i<volumes.length;i++)
		{
			var position=0;
			var rect={
				clip:volumes[i].clip.getBoundingClientRect(),
				canvas:volumes[i].canvas.getBoundingClientRect(),
				container:volumes[i].container.getBoundingClientRect()
			};
			position+=rect.canvas.left-rect.container.left;
			position+=rect.canvas.width*(volumes[i].volume/volumes[i].max);
			volumes[i].clip.css({'left':position.toString()+'px'});
		}
	}
	/* draw canvas */
	redraw(){
		var context=null;
		var height=0;
		var width=0;
		/* hue */
		height=this.hue.caption.outerheight(true);
		width=this.hue.container.innerwidth()-this.hue.caption.outerwidth(true);
		this.hue.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.hue.canvas.getContext)
		{
			context=this.hue.canvas.getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl('+(i*this.hue.max/width).toString()+',50%,50%)';
				context.fillRect(i,0,i,height);
			}
		}
		/* saturation */
		height=this.saturation.caption.outerheight(true);
		width=this.saturation.container.innerwidth()-this.saturation.caption.outerwidth(true);
		this.saturation.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.saturation.canvas.getContext)
		{
			context=this.saturation.canvas.getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl('+this.hue.volume.toString()+','+(i*this.saturation.max/width)+'%,50%)';
				context.fillRect(i,0,i,height);
			}
		}
		/* brightness */
		height=this.brightness.caption.outerheight(true);
		width=this.brightness.container.innerwidth()-this.brightness.caption.outerwidth(true);
		this.brightness.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.brightness.canvas.getContext)
		{
			context=this.brightness.canvas.getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl(0,0%,'+(i*this.brightness.max/width)+'%)';
				context.fillRect(i,0,i,height);
			}
		}
	}
	/* convert HEX color */
	toHEX(){
		var color='';
		var hsb={h:this.hue.volume,s:this.saturation.volume,b:this.brightness.volume};
		var rgb={r:0,g:0,b:0};
		var hex=(value) => {
			var sin="0123456789ABCDEF";
			if(value>255) return 'FF';
			if(value<0) return '00';
			return sin.charAt(Math.floor(value/16))+sin.charAt(value%16);
		};
		hsb.h/=60;
		hsb.s/=100;
		hsb.b/=100;
		rgb.r=hsb.b;
		rgb.g=hsb.b;
		rgb.b=hsb.b;
		if (hsb.s>0)
		{
			var index=Math.floor(hsb.h);
			switch (index)
			{
				case 0:
					rgb.g=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 1:
					rgb.r=hsb.b*(1-hsb.s*(hsb.h-index));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 2:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					break;
				case 3:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.g=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
				case 4:
					rgb.r=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.g=hsb.b*(1-hsb.s);
					break;
				case 5:
					rgb.g=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
			}
		}
		color+=hex(Math.round(rgb.r*255));
		color+=hex(Math.round(rgb.g*255));
		color+=hex(Math.round(rgb.b*255));
		this.hue.display.html(this.hue.volume);
		this.saturation.display.html(this.saturation.volume);
		this.brightness.display.html(this.brightness.volume);
		this.hex.val(color);
		this.thumbnail.css({'background-color':'#'+color});
	}
	/* convert HSB color */
	toHSB(color){
		var colors=[];
		var hsb={h:0,s:0,b:0};
		var rgb={r:0,g:0,b:0};
		var diff={check:0,r:0,g:0,b:0};
		var max=0;
		var min=0;
		color=color.replace(/(#|rgba|rgb|\(|\))/g,'');
		colors=color.split(',');
		if (colors.length==1)
		{
			switch (color.length)
			{
				case 3:
					rgb.r=parseInt(color.substr(0,1),16);
					rgb.g=parseInt(color.substr(1,1),16);
					rgb.b=parseInt(color.substr(2,1),16);
					break;
				case 6:
					rgb.r=parseInt(color.substr(0,2),16);
					rgb.g=parseInt(color.substr(2,2),16);
					rgb.b=parseInt(color.substr(4,2),16);
					break;
			}
		}
		else
		{
			rgb.r=parseInt(colors[0]);
			rgb.g=parseInt(colors[1]);
			rgb.b=parseInt(colors[2]);
		}
		rgb.r/=255;
		rgb.g/=255;
		rgb.b/=255;
		hsb.b=Math.max(rgb.r,rgb.g,rgb.b);
		diff.check=hsb.b-Math.min(rgb.r,rgb.g,rgb.b);
		diff.r=(hsb.b-rgb.r)/6/diff.check+1/2;;
		diff.g=(hsb.b-rgb.g)/6/diff.check+1/2;;
		diff.b=(hsb.b-rgb.b)/6/diff.check+1/2;;
		if (diff.check!==0)
		{
			hsb.s=diff.check/hsb.b;
			if (rgb.r===hsb.b) hsb.h=diff.b-diff.g;
			else if (rgb.g===hsb.b) hsb.h=(1/3)+diff.r-diff.b;
			else if (rgb.b===hsb.b) hsb.h=(2/3)+diff.g-diff.r;
			if (hsb.h < 0) hsb.h+=1;
			else if (hsb.h > 1) hsb.h-=1;
		}
		hsb.h=Math.round(hsb.h*360);
		hsb.s=Math.round(hsb.s*100);
		hsb.b=Math.round(hsb.b*100);
		this.hue.volume=hsb.h;
		this.saturation.volume=hsb.s;
		this.brightness.volume=hsb.b;
		this.toHEX();
	}
	/* show color */
	show(color,callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* show */
		this.cover.css({display:'block'});
		/* convert HSB color */
		this.toHSB(color)
		/* attach volume */
		this.attachvolume();
	}
	/* hide calendar */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tiscolorpicker{
	/* constructor */
	constructor(){
		var div=tis.create('div');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.callback=null;
		this.colors=[
			'#d7000f',
			'#e60012',
			'#ea5532',
			'#f6ad3c',
			'#f39800',
			'#e48e00',
			'#f3e100',
			'#fff100',
			'#fff33f',
			'#aacf52',
			'#8fc31f',
			'#86b81b',
			'#009140',
			'#009944',
			'#00a95f',
			'#00ada9',
			'#009e96',
			'#00958d',
			'#0097db',
			'#00a0e9',
			'#00afec',
			'#187fc4',
			'#0068b7',
			'#0062ac',
			'#1b1c80',
			'#1d2088',
			'#4d4398',
			'#a64a97',
			'#920783',
			'#8a017c',
			'#d60077',
			'#e4007f',
			'#e85298',
			'#e9546b',
			'#e5004f',
			'#d7004a'
		];
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc(400px + 5em)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'2em 0px 3em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)',
			width:'400px'
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px 2px',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderTop:'1px solid #42a5f5',
			bottom:'0px',
			left:'0px',
			position:'absolute',
			width:'100%'
		});
		this.close=tis.create('img').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			right:'0px',
			top:'0px',
			width:'2em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		this.input=tis.create('input').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'1em',
			height:'3em',
			lineHeight:'3em',
			margin:'0px',
			outline:'none',
			padding:'0px 5em 0px 1em',
			position:'relative',
			verticalAlign:'top',
			width:'100%'
		})
		.attr('placeholder','16進数カラーコードを入力')
		.attr('type','text');
		this.submit=tis.create('button').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			color:'#42a5f5',
			cursor:'pointer',
			display:'inline-block',
			fontSize:'1em',
			height:'3em',
			lineHeight:'3em',
			margin:'0px',
			outline:'none',
			padding:'0px',
			position:'absolute',
			right:'0px',
			textAlign:'center',
			top:'0px',
			verticalAlign:'top',
			width:'5em'
		})
		.html('OK')
		.on('mouseover',(e) => e.currentTarget.css({fontWeight:'bold'}))
		.on('mouseout',(e) => e.currentTarget.css({fontWeight:'normal'}))
		.on('click',(e) => {
			if (!this.input.val()) tis.alert('カラーコードを入力して下さい');
			else
			{
				if (this.callback) this.callback('#'+this.input.val().replace(/#/g,''));
				this.hide();
			}
		});
		/* create cells */
		for (var i=0;i<this.colors.length;i++)
			((index) => {
				this.contents.append(
					div.clone().css({
						backgroundColor:this.colors[index],
						cursor:'pointer',
						display:'inline-block',
						paddingTop:'calc(16.5% - 4px)',
						margin:'2px',
						verticalAlign:'top',
						width:'calc(16.5% - 4px)'
					})
					.on('click',(e) => {
						if (this.callback) this.callback(this.colors[index]);
						this.hide();
					})
				);
			})(i);
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.input)
					.append(this.submit)
				)
				.append(this.close)
			)
		);
	}
	/* show color */
	show(callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* setup elements */
		this.input.val('');
		/* show */
		this.cover.css({display:'block'});
	}
	/* hide calendar */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tisdatepicker{
	/* constructor */
	constructor(){
		var div=tis.create('div');
		var img=tis.create('img');
		var week=['日','月','火','水','木','金','土'];
		var params={
			height:0,
			width:0,
			rows:7,
			cells:{
				height:30,
				width:30
			},
			margin:{
				left:10,
				right:10,
				top:5,
				bottom:10
			}
		};
		/* initialize valiable */
		params.height=params.cells.height*params.rows+params.rows;
		params.width=params.cells.width*week.length;
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		img.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			top:'0px',
			width:'2em'
		});
		/* setup properties */
		this.callback=null;
		this.activedate=new Date();
		this.month=new Date().calc('first-of-month');
		this.styles={
			active:{
				backgroundColor:'#42a5f5',
				color:'#ffffff'
			},
			normal:{
				backgroundColor:'#ffffff',
				color:tis.elm('body').css('color')
			},
			saturday:{
				backgroundColor:'#ffffff',
				color:'#42a5f5'
			},
			sunday:{
				backgroundColor:'#ffffff',
				color:'#fa8273'
			},
			today:{
				backgroundColor:'#ffb46e',
				color:'#ffffff'
			}
		};
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc('+(params.height+params.margin.top+params.margin.bottom).toString()+'px + 4em)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'4em 0px 0px 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)'
		});
		this.contents=tis.create('table').css({
			borderCollapse:'collapse',
			height:params.height.toString()+'px',
			marginLeft:params.margin.left.toString()+'px',
			marginRight:params.margin.right.toString()+'px',
			marginTop:params.margin.top.toString()+'px',
			marginBottom:params.margin.bottom.toString()+'px',
			width:params.width.toString()+'px'
		});
		this.buttons=div.clone().css({
			left:'0px',
			position:'absolute',
			top:params.cells.height.toString()+'px',
			width:'100%'
		});
		this.caption=tis.create('span').css({
			boxSizing:'border-box',
			display:'block',
			lineHeight:'2em',
			position:'relative',
			textAlign:'center',
			width:'100%'
		});
		this.close=img.clone()
		.css({right:'0px'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		this.prev=img.clone()
		.css({left:'0px'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			/* calc months */
			this.month=this.month.calc('-1 month').calc('first-of-month');
			/* show calendar */
			this.show();
		});
		this.next=img.clone()
		.css({right:'0px'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			/* calc months */
			this.month=this.month.calc('1 month').calc('first-of-month');
			/* show calendar */
			this.show();
		});
		/* create cells */
		for (var i=0;i<week.length*params.rows;i++)
		{
			if (i%week.length==0) this.contents.append(tis.create('tr'));
			var td=tis.create('td').css({
				border:'1px solid #c9c9c9',
				boxSizing:'border-box',
				color:this.styles.normal.color,
				fontSize:'13px',
				height:params.cells.height.toString()+'px',
				lineHeight:params.cells.height.toString()+'px',
				margin:'0px',
				padding:'0px',
				textAlign:'center',
				width:params.cells.width.toString()+'px'
			}).on('click',(e) => {
				if (tis.isnumeric(e.currentTarget.text()))
				{
					var day=new Date((this.caption.text()+'-01').replace(/-/g,'\/'));
					day=day.calc((parseInt(e.currentTarget.text())-1).toString()+' day');
					if (this.callback) this.callback(day.format('Y-m-d'));
				}
				this.hide();
			});
			this.contents.elms('tr').last().append(td);
		}
		/* create header */
		this.contents.elms('tr')[0].elms('td').some((item,index) => {
			item.html(week[index]);
		});
		this.contents.elms('tr').some((item,index) => {
			if (index>0)
			{
				/* setup styles */
				item.elms('td')[0].css(this.styles.sunday);
				item.elms('td')[6].css(this.styles.saturday);
			}
		});
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.caption)
					.append(this.prev)
					.append(this.next)
				)
				.append(this.close)
			)
		);
	}
	/* show calendar */
	show(activedate,callback){
		var row=0;
		var cell=0;
		if (activedate)
			if (activedate.match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g))
			{
				this.activedate=new Date(activedate.replace(/-/g,'\/'));
				this.month=this.activedate.calc('first-of-month');
			}
		/* setup callback */
		if (callback) this.callback=callback;
		/* setup calendar */
		this.caption.html(this.month.format('Y-m'));
		this.contents.elms('tr').some((item,index) => {
			if (row>0)
				item.elms('td').some((item,index) => {
					var day=this.month;
					var span=cell-this.month.getDay();
					var style=this.styles.normal;
					/* not process if it less than the first of this month */
					if (span<0)
					{
						item.css(style).html('&nbsp;');
						cell++;
						return false;
					}
					else day=day.calc(span.toString()+' day');
					/* not process it if it exceeds the end of this month */
					if (day.format('Y-m')!=this.month.format('Y-m'))
					{
						item.css(style).html('&nbsp;');
						cell++;
						return false;
					}
					/* setup styles */
					switch ((cell+1)%7)
					{
						case 0:
							style=this.styles.saturday;
							break;
						case 1:
							style=this.styles.sunday;
							break;
					}
					if(day.format('Y-m-d')==new Date().format('Y-m-d')) style=this.styles.today;
					if (day.format('Y-m-d')==this.activedate.format('Y-m-d')) style=this.styles.active;
					style['cursor']='pointer';
					item.css(style).html((span+1).toString());
					cell++;
				});
			row++;
		});
		/* show */
		this.cover.css({display:'block'});
	}
	/* hide calendar */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tismultipicker{
	/* constructor */
	constructor(){
		var button=tis.create('button');
		var div=tis.create('div');
		var active=(e) => e.currentTarget.css({fontWeight:'bold'});
		var passive=(e) => e.currentTarget.css({fontWeight:'normal'});
		/* initialize valiable */
		button.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			color:'#42a5f5',
			cursor:'pointer',
			display:'inline-block',
			fontSize:'1em',
			lineHeight:'2.5em',
			margin:'0px',
			outline:'none',
			padding:'0px 0.5em',
			position:'relative',
			textAlign:'center',
			verticalAlign:'top',
			width:'50%'
		});
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.callback=null;
		this.table=null;
		this.columninfos={};
		this.records=[];
		this.selection=[];
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc(34.5em + 16px)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			minWidth:'15em',
			padding:'1em 0px 3.5em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)'
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderTop:'1px solid #42a5f5',
			bottom:'0px',
			left:'0px',
			position:'absolute',
			width:'100%'
		});
		this.ok=button.clone().html('OK')
		.css({borderRight:'1px solid #42a5f5'})
		.on('mouseover',active)
		.on('mouseout',passive)
		.on('focus',active)
		.on('blur',passive)
		.on('click',(e) => {
			var res=[];
			if (this.callback)
			{
				for (var i=0;i<this.selection.length;i++) res.push(this.records[this.selection[i]-1]);
				this.callback(res);
			}
			this.hide();
		});
		this.cancel=button.clone().html('Cancel')
		.on('mouseover',active)
		.on('mouseout',passive)
		.on('focus',active)
		.on('blur',passive)
		.on('click',(e) => this.hide());
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.ok)
					.append(this.cancel)
				)
			)
		);
	}
	/* show records */
	show(records,columninfos,callback){
		var row=null;
		var div=tis.create('div');
		var td=tis.create('td');
		var th=tis.create('th');
		/* initialize valiable */
		div.css({
			backgroundColor:'#ffffff',
			borderBottom:'1px solid #42a5f5',
			boxSizing:'border-box',
			padding:'0px 0.5em',
			position:'relative'
		});
		td.css({
			border:'none',
			borderBottom:'1px solid #42a5f5',
			boxSizing:'border-box',
			cursor:'pointer',
			lineHeight:'1.5em',
			margin:'0px',
			padding:'0.25em 0.5em'
		});
		th.css({
			border:'none',
			boxSizing:'border-box',
			fontWeight:'normal',
			lineHeight:'2em',
			margin:'0px',
			padding:'0px',
			position:'-webkit-sticky',
			position:'sticky',
			textAlign:'center',
			top:'0',
			zIndex:'2'
		});
		/* check records */
		if(records instanceof Array)
		{
			if (records.length!=0)
			{
				/* setup properties */
				this.callback=callback;
				this.columninfos=columninfos;
				this.records=records;
				this.selection=[];
				/* create table */
				this.table=tis.create('table').css({
					borderCollapse:'collapse',
					width:'100%'
				})
				.append(tis.create('thead').append(tis.create('tr')))
				.append(tis.create('tbody').append(tis.create('tr')));
				for (var key in this.columninfos)
				{
					this.table.elm('thead tr').append(
						th.clone().css({
							display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
							width:(('width' in this.columninfos[key])?this.columninfos[key].width:'auto')
						})
						.append(div.clone().html(('text' in this.columninfos[key])?this.columninfos[key].text:''))
					);
					row=td.clone().css({
						display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
						textAlign:(('align' in this.columninfos[key])?this.columninfos[key].align:'left')
					})
					.attr('id',key);
					if ('digit' in this.columninfos[key]) row.attr('data-digit',this.columninfos[key].digit);
					this.table.elm('tbody tr').append(row);
				}
				this.contents.empty().append(
					this.table.spread((row,index) => {
						row.on('click',(e) => {
							if (this.selection.indexOf(index)<0)
							{
								this.selection.push(index);
								row.css({backgroundColor:'#a0d8ef'});
							}
							else
							{
								this.selection=this.selection.filter((item) => {
									return item!=index;
								});
								row.css({backgroundColor:'transparent'});
							}
						});
					})
				);
				/* append records */
				this.table.clearrows();
				for (var i=0;i<this.records.length;i++)
				{
					row=this.table.addrow();
					for (var key in this.columninfos)
					{
						if (row.elm('#'+key).hasAttribute('data-digit'))
						{
							if (this.records[i][key]) row.elm('#'+key).html(Number(this.records[i][key]).comma(row.elm('#'+key).attr('data-digit')));
							else row.elm('#'+key).html(this.records[i][key]);
						}
						else row.elm('#'+key).html(this.records[i][key]);
					}
				}
				/* show */
				this.cover.css({display:'block'});
			}
			else tis.alert('レコードがありません');
		}
		else tis.alert('レコードの指定に誤りがあります');
	}
	/* hide records */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tisrecordpicker{
	/* constructor */
	constructor(){
		var div=tis.create('div');
		var img=tis.create('img');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		img.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			top:'0.25em',
			width:'2em'
		});
		/* setup properties */
		this.limit=50;
		this.offset=0;
		this.table=null;
		this.columninfos={};
		this.filter=[];
		this.records=[];
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc(33em + 16px)',
			left:'50%',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			minWidth:'15em',
			padding:'2.5em 0px 0.5em 0px',
			position:'absolute',
			top:'50%',
			transform:'translate(-50%,-50%)'
		});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px',
			textAlign:'center',
			width:'100%'
		});
		this.buttons=div.clone().css({
			borderBottom:'1px solid #42a5f5',
			left:'0px',
			padding:'0.25em 0px',
			position:'absolute',
			top:'0px',
			width:'100%',
			zIndex:'2'
		});
		this.prev=img.clone()
		.css({right:'4.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.offset-=this.limit;
			/* search records */
			this.search();
		});
		this.next=img.clone()
		.css({right:'2.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.offset+=this.limit;
			/* search records */
			this.search();
		});
		this.close=img.clone()
		.css({right:'0.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => this.hide());
		this.submit=img.clone()
		.css({left:'0.25em'})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSgVSxGJhoEqHM9wRKs/1Q9RuoGdSCSL2E+WiW7oc5Cpbl8A3Jkduufo8jAT0AWqqIRQ1RDTtSuqmw+PwANPgCWm/CgNRWJTUa9Lja03gtp0Y+xpWi5+Nr3lJsMTRFJ5JqOTV8zAANUpyW08xiIiynncV4LBekW0MO1GQiawxwFAwrABCgXau9QRCIoYQJWMENdAJlBCZQJjCOwAZugE4AG+AGygSs4AjapJra8HF3HEcx96J/jCR91uu1r8+/PDw8/k+FUGw+jzhg9gGGT+iSMjJkLoMwzgxVS5v/xKG1Jp9tA+IfIIDOPDYRMZwRRgnozogq77dxysvZvwE2Z7E4wi17h2yMyMacI5Dl1dTZDjWCixjZZKyiiFm9EAmlmjrDOvMDlc5KE9FhQOwArHU3k1MSpqgtx3FzVbRMCW8tDnURq+AyzjCe108wO4uTZ8GOykNSlYYrqWEBJiMy25Dr7SvRiWs8WuQ7OIOpSveERalg9/j5/exJeqcVYeC7gUIUBd3i+Q9R7N5y8v0n/pDl7IRbyB/e733QvxmAwK+cQE+bSmHFVjC7F5RbVRQwirgI82vPrsE6cTFuXxTPc4NHtYiLszcbEofitlG5JUJphCFbuKdLNR77FM3lZdgw48om0MU49juIO1dMPDw8PJziBXvFttyY+HdhAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.offset=0;
			/* search records */
			this.search();
		});
		this.input=tis.create('input').css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			display:'inline-block',
			fontSize:'1em',
			height:'2em',
			lineHeight:'2em',
			margin:'0px',
			outline:'none',
			padding:'0px 2.5em',
			position:'relative',
			verticalAlign:'top',
			width:'100%'
		})
		.attr('placeholder','キーワードを入力')
		.attr('type','text');
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
				.append(
					this.buttons
					.append(this.input)
					.append(this.close)
					.append(this.next)
					.append(this.prev)
					.append(this.submit)
				)
			)
		);
	}
	/* search records */
	search(callback){
		var row=null;
		var records=this.records;
		if (this.input.val())
		{
			var keyword=this.input.val();
			records=records.filter((record) => {
				for (var key in record)
					if (record[key])
						if (record[key].match(new RegExp(keyword,'ig'))) return true;
				return false;
			});
		}
		/* append records */
		this.filter=[];
		this.table.clearrows();
		for (var i=this.offset;i<this.offset+this.limit;i++)
			if (i<records.length)
			{
				row=this.table.addrow();
				for (var key in this.columninfos)
				{
					if (row.elm('#'+key).hasAttribute('data-digit'))
					{
						if (records[i][key]) row.elm('#'+key).html(Number(records[i][key]).comma(row.elm('#'+key).attr('data-digit')));
						else row.elm('#'+key).html(records[i][key]);
					}
					else row.elm('#'+key).html(records[i][key]);
				}
				this.filter.push(records[i]);
			}
		if (records.length>this.limit)
		{
			if (this.offset>0) this.prev.show();
			else this.prev.hide();
			if (this.offset+this.limit<records.length) this.next.show();
			else this.next.hide();
			this.input.css({paddingRight:'6.5em'});
		}
		else
		{
			this.prev.hide();
			this.next.hide();
			this.input.css({paddingRight:'2.5em'});
		}
		if (callback) callback();
	}
	/* show records */
	show(records,columninfos,callback){
		var row=null;
		var div=tis.create('div');
		var td=tis.create('td');
		var th=tis.create('th');
		/* initialize valiable */
		div.css({
			backgroundColor:'#ffffff',
			borderBottom:'1px solid #42a5f5',
			boxSizing:'border-box',
			padding:'0px 0.5em',
			position:'relative'
		});
		td.css({
			border:'none',
			borderBottom:'1px solid #42a5f5',
			boxSizing:'border-box',
			cursor:'pointer',
			lineHeight:'1.5em',
			margin:'0px',
			padding:'0.25em 0.5em'
		});
		th.css({
			border:'none',
			boxSizing:'border-box',
			fontWeight:'normal',
			lineHeight:'2em',
			margin:'0px',
			padding:'0px',
			position:'-webkit-sticky',
			position:'sticky',
			textAlign:'center',
			top:'0',
			zIndex:'2'
		});
		/* check records */
		if(records instanceof Array)
		{
			if (records.length!=0)
			{
				/* setup properties */
				this.offset=0;
				this.columninfos=columninfos;
				this.records=records;
				/* setup elements */
				this.input.val('');
				/* create table */
				this.table=tis.create('table').css({
					borderCollapse:'collapse',
					width:'100%'
				})
				.append(tis.create('thead').append(tis.create('tr')))
				.append(tis.create('tbody').append(tis.create('tr')));
				for (var key in this.columninfos)
				{
					this.table.elm('thead tr').append(
						th.clone().css({
							display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
							width:(('width' in this.columninfos[key])?this.columninfos[key].width:'auto')
						})
						.append(div.clone().html(('text' in this.columninfos[key])?this.columninfos[key].text:''))
					);
					row=td.clone().css({
						display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
						textAlign:(('align' in this.columninfos[key])?this.columninfos[key].align:'left')
					})
					.attr('id',key);
					if ('digit' in this.columninfos[key]) row.attr('data-digit',this.columninfos[key].digit);
					this.table.elm('tbody tr').append(row);
				}
				this.contents.empty().append(
					this.table.spread((row,index) => {
						row.on('click',(e) => {
							if (callback) callback(this.filter[index-1]);
							this.hide();
						});
					})
				);
				/* show */
				this.search(() => this.cover.css({display:'block'}));
			}
			else tis.alert('レコードがありません');
		}
		else tis.alert('レコードの指定に誤りがあります');
	}
	/* hide records */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tisgraph{
	/* constructor */
	/*
	* parameters
	* @canvas	:グラフ描画キャンバス
	* @type		:グラフタイプ【circle:line】
	* @scale	:目盛設定
	*	example
	*	{
	*		position:【left:right】,
	*		width:幅,
	*		min:最小目盛,
	*		max:最大目盛
	*	}
	* @captions	:項目名
	* @styles	:マーカースタイル
	*	example
	*	for circle	['#FF0000','#00FF00','#0000FF']
	*	for line	[
	*					{
	*						color:'#FF0000',
	*						dot:false
	*					},
	*					{
	*						color:'#00FF00',
	*						dot:true
	*					}
	*				]
	* @values	:データ値
	*	for circle	[100,200,300]
	*	for line	[
	*					[100,200,300],
	*					[100,200,300]
	*				]
	*/
	constructor(canvas,type,scale,captions,styles,values){
		/* setup properties */
		this.graph=canvas;
		this.type=type;
		this.scale=scale;
		this.captions=captions;
		this.styles=styles;
		this.values=values;
		this.defaultstyle=getComputedStyle(this.graph);
		if (!('position' in this.scale)) this.scale['position']='left';
		if (!('width' in this.scale)) this.scale['width']=0;
		if (!('min' in this.scale)) this.scale['min']=null;
		if (!('max' in this.scale)) this.scale['max']=null;
		if (this.graph.getContext)
		{
			this.context=this.graph.getContext('2d');
			if (this.styles.length!=this.values.length) tis.alert('データ値とマーカスタイルの数が一致しません');
			switch(this.type)
			{
				case 'line':
					if (this.captions.length!=this.values[0].length) tis.alert('データ値との項目名の数が一致しません');
					break;
			}
		}
		else tis.alert('本サービスはご利用中のブラウザには対応しておりません');
	}
	/* draw line */
	line(type,left,top,distance,width,color,dot){
		if (this.context)
		{
			var path=new Path2D();
			path.moveTo(left,top);
			switch (type)
			{
				case 'holizontal':
					path.lineTo(left+distance,top);
					break;
				case 'vertical':
					path.lineTo(left,top+distance);
					break;
			}
			this.context.lineWidth=width;
			this.context.strokeStyle=color;
			if (dot!=0)
			{
				this.context.setLineDash([dot]);
				this.context.lineDashOffset=dot;
			}
			else this.context.setLineDash([]);
			this.context.stroke(path);
		}
	}
	/* draw graph */
	redraw(){
		var padding={left:10,right:10,top:10,bottom:10,holizontal:20,vertical:20};
		var path=new Path2D();
		/* initialize elements */
		this.context.clearRect(0,0,this.graph.clientWidth,this.graph.clientHeight);
		switch(this.type)
		{
			case 'circle':
				var from=0;
				var to=0;
				var radius=((this.graph.clientWidth>this.graph.clientHeight)?this.graph.clientHeight-padding.vertical:this.graph.clientWidth-padding.holizontal)/2;
				var center={
					x:this.graph.clientWidth/2,
					y:this.graph.clientHeight/2
				};
				/* draw graph */
				for (var i=0;i<this.values.length;i++)
				{
					to=from+(this.values[i]/100*Math.PI*2);
					path=new Path2D();
					path.moveTo(center.x,center.y);
					path.arc(center.x,center.y,radius,from-(Math.PI/2),to-(Math.PI/2),false);
					this.context.fillStyle=this.styles[i];
					this.context.fill(path);
					from=to;
				}
				break;
			case 'line':
				var left=0;
				var top=0;
				var maxvalue=(this.scale.max==null)?Number.MIN_SAFE_INTEGER:this.scale.max;
				var minvalue=(this.scale.min==null)?Number.MAX_SAFE_INTEGER:this.scale.min;
				var caption={height:0,width:0};
				var plot={height:0,width:0};
				var step={caption:1,plot:5};
				var scale={height:0,width:0,amount:0};
				/* initialize valiable */
				for (var i=0;i<this.captions.length;i++)
				{
					var captions=this.captions[i].split(/\r\n|\r|\n/);
					if (step.caption<captions) step.caption=captions;
				}
				padding={left:10,right:15,top:15+((this.scale.label)?parseFloat(this.defaultstyle.fontSize)*2:0),bottom:5,holizontal:0,vertical:0,caption:10,scale:10};
				padding.holizontal=padding.left+padding.right+padding.scale;
				padding.vertical=padding.top+padding.bottom+padding.caption;
				/* calculate scale size */
				for (var i=0;i<this.values.length;i++)
				{
					var values=this.values[i];
					for (var i2=0;i2<values.length;i2++)
					{
						if (this.scale.max==null && maxvalue<Math.ceil(values[i2])) maxvalue=Math.ceil(values[i2]);
						if (this.scale.min==null && minvalue>Math.floor(values[i2])) minvalue=Math.floor(values[i2]);
					}
				}
				if (this.scale.min==null)
				{
					if (minvalue<0)
					{
						maxvalue=Math.max(maxvalue,minvalue*-1);
						minvalue=Math.max(maxvalue,minvalue*-1)*-1;
					}
					else minvalue=0;
				}
				if (this.scale.max==null)
				{
					if (maxvalue.toString().length>1)
					{
						var pow=Math.pow(10,maxvalue.toString().length-1);
						maxvalue=Math.floor(maxvalue/pow)*pow+pow;
						if (minvalue<0) minvalue=maxvalue*-1;
					}
				}
				scale.amount=(maxvalue-minvalue)/(step.plot-1);
				if (!this.scale.width)
				{
					var scalecheck='';
					var scalelength=0;
					for (var i=0;i<step.plot;i++)
					{
						scalecheck=(maxvalue-(scale.amount*i)).toFixed(10).replace(/[0]+$/g,'').replace(/.$/g,'');
						if (scalelength<scalecheck.length) scalelength=scalecheck.length;
					}
					scale.width=scalelength*parseFloat(this.defaultstyle.fontSize)/2;
				}
				else scale.width=this.scale.width;
				scale.height=(this.graph.clientHeight-parseFloat(this.defaultstyle.fontSize)*1.5*step.caption-padding.vertical)/(step.plot-1);
				/* calculate plot size */
				plot.height=this.graph.clientHeight-parseFloat(this.defaultstyle.fontSize)*1.5*step.caption-padding.vertical;
				plot.width=this.graph.clientWidth-padding.holizontal-scale.width;
				/* calculate caption size */
				caption.height=parseFloat(this.defaultstyle.fontSize)*1.5*step.caption+padding.caption;
				caption.width=plot.width/this.captions.length;
				/* setup drawing */
				this.context.font=this.defaultstyle.fontStyle+' '+this.defaultstyle.fontVariant+' '+this.defaultstyle.fontWeight+' '+(parseFloat(this.defaultstyle.fontSize)*0.75)+'px '+this.defaultstyle.fontFamily;
				this.context.lineCap='round';
				this.context.lineJoin='round';
				this.context.textBaseline='middle';
				this.context.translate(0.5,0.5);
				/* draw scale */
				if (this.scale.position=='left')
				{
					left=scale.width+padding.left;
					top=padding.top;
					for (var i=0;i<step.plot;i++)
					{
						/* draw an additional line */
						this.line('holizontal',left+padding.scale,top,plot.width,1,this.defaultstyle.color,((i==step.plot-1)?0:2));
						/* draw scale */
						this.context.textAlign='right';
						this.context.fillText(maxvalue-(scale.amount*i),left,top,scale.width);
						top+=scale.height;
					}
					/* draw an additional line */
					this.line('vertical',left+padding.scale,padding.top,plot.height,1,this.defaultstyle.color,0);
					/* draw scale caption */
					if (this.scale.label)
						if (this.scale.label.length!=0)
						{
							this.context.textAlign='right';
							this.context.fillText(this.scale.label,left,padding.top-(parseFloat(this.defaultstyle.fontSize)*1.5),scale.width);
						}
				}
				else
				{
					left=plot.width+padding.left+padding.scale;
					top=padding.top;
					for (var i=0;i<step.plot;i++)
					{
						/* draw an additional line */
						this.line('holizontal',padding.left,top,plot.width,1,this.defaultstyle.color,((i==step.plot-1)?0:2));
						/* draw scale */
						this.context.textAlign='left';
						this.context.fillText(maxvalue-(scale.amount*i),left,top,scale.width);
						top+=scale.height;
					}
					/* draw an additional line */
					this.line('vertical',plot.width+padding.left,padding.top,plot.height,1,this.defaultstyle.color,0);
					/* draw scale caption */
					if (this.scale.label)
						if (this.scale.label.length!=0)
						{
							this.context.textAlign='left';
							this.context.fillText(this.scale.label,left,padding.top-(parseFloat(this.defaultstyle.fontSize)*1.5),scale.width);
						}
				}
				/* draw caption */
				left=((this.scale.position=='left')?(scale.width+padding.scale):0)+(caption.width/2)+padding.left;
				top=plot.height+(parseFloat(this.defaultstyle.fontSize)*0.25)+padding.top+padding.caption;
				for (var i=0;i<this.captions.length;i++)
				{
					var captions=this.captions[i].split(/\r\n|\r|\n/);
					this.context.textAlign='center';
					for (var i2=0;i2<captions.length;i2++) this.context.fillText(captions[i2],left,top+(parseFloat(this.defaultstyle.fontSize)*1.5*i2),caption.width);
					left+=caption.width;
				}
				/* draw graph */
				for (var i=0;i<this.values.length;i++)
				{
					var values=this.values[i];
					var ratio=(maxvalue/(maxvalue-minvalue))-(values[0]/(maxvalue-minvalue));
					path=new Path2D();
					left=((this.scale.position=='left')?(scale.width+padding.scale):0)+(caption.width/2)+padding.left;
					path.moveTo(left,plot.height*ratio+padding.top);
					for (var i2=0;i2<values.length;i2++)
					{
						if (i2!=0)
						{
							ratio=(maxvalue/(maxvalue-minvalue))-(values[i2]/(maxvalue-minvalue));
							path.lineTo(left,plot.height*ratio+padding.top);
							path.moveTo(left,plot.height*ratio+padding.top);
						}
						left+=caption.width;
					}
					this.context.lineWidth=1;
					this.context.strokeStyle=this.styles[i].color;
					if (this.styles[i].dot)
					{
						this.context.setLineDash([5]);
						this.context.lineDashOffset=3;
					}
					else this.context.setLineDash([]);
					this.context.stroke(path);
					this.context.save();
					this.context.translate(0.5,0.5);
					this.context.stroke(path);
					this.context.restore();
				}
				break;
		}
	}
};
class tismap{
	/* constructor */
	constructor(){
		/* setup properties */
		this.loaded=false;
		this.map=null;
		this.centerlocation=null;
		this.directionsRenderer=null;
		this.directionsService=null;
		this.geocoder=null;
		this.watchID=null;
		this.watchaccuracy=null;
		this.watchcurrent=new Date();
		this.watchstart=new Date();
		this.balloons=[];
		this.markers=[];
	}
	/* initialize */
	/*
	* parameters
	* @mapoption
	*	-center
	*	-fullscreenControl
	*	-fullscreenControlOptions
	*	-gestureHandling
	*	-mapTypeControl
	*	-mapTypeControlOptions:{
	*	-	style:
	*	-	position:
	*	-},
	*	-overviewMapControl
	*	-panControl
	*	-scaleControl
	*	-streetViewControl
	*	-zoomControl
	*	-zoom
	*/
	init(apikey,map,mapoption,loaded,clicked){
		var wait=(callback) => {
			setTimeout(() => {
				if (typeof(google)=='undefined') wait(callback);
				else callback();
			},500);
		};
		if (!apikey)
		{
			tis.alert('APIキーを取得して下さい');
			return;
		}
		/* load api */
		tis.elm('head').append(
			tis.create('script')
			.attr('type','text/javascript')
			.attr('src','https://maps.googleapis.com/maps/api/js?key='+apikey)
		);
		wait(() => {
			if (map)
			{
				this.map=new google.maps.Map(map,mapoption);
				this.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
				this.directionsService=new google.maps.DirectionsService();
				if (loaded)
				{
					google.maps.event.addListener(this.map,'idle',() => {
						if (!this.loaded)
						{
							this.loaded=true;
							loaded();
						}
						this.centerlocation=this.map.getCenter();
					});
					/* resize event */
					window.on('resize',(e) => this.map.setCenter(this.centerlocation));
				}
				if (clicked) google.maps.event.addListener(this.map,'click',(e) => this.searchaddress(e.latLng.lat(),e.latLng.lng(),(result) => clicked(result,e.latLng)));
			}
			this.geocoder=new google.maps.Geocoder();
		});
	}
	/* get bounds */
	bounds(){
		var res=this.map.getBounds();
		return {
			north:res.getNorthEast().lat(),
			south:res.getSouthWest().lat(),
			east:res.getNorthEast().lng(),
			west:res.getSouthWest().lng()
		};
	}
	/* close information widnow */
	closeinfowindow(){
		for (var i=0;i<this.balloons.length;i++) this.balloons[i].close();
	}
	/* open information widnow */
	openinfowindow(){
		for (var i=0;i<this.balloons.length;i++)
			if (this.markers.length>i) this.balloons[i].open(this.map,this.markers[i]);
	}
	/* reload map */
	reloadmap(markers,addroute,callback){
		/*
		* parameters
		* @markeroptions
		*	-backcolor	:マーカー背景色
		*	-forecolor	:マーカー前景色
		*	-fontsize	:マーカーフォントサイズ
		*	-label		:マーカーラベル
		*	-clicked	:マーカークリックイベント
		*	-balloon	:情報ウィンドウラベル
		*/
		var addmarker=(markeroptions,index) => {
			var backcolor='#'+(('backcolor' in markeroptions)?markeroptions.backcolor:'e60012');
			var forecolor='#'+(('forecolor' in markeroptions)?markeroptions.forecolor:'000000');
			var fontsize=(('fontsize' in markeroptions)?markeroptions.fontsize:'11')+'px';
			var marker=new google.maps.Marker({
				map:this.map,
				position:markeroptions.latlng
			});
			marker.setIcon({
				anchor:new google.maps.Point(17,34),
				fillColor:backcolor,
				fillOpacity:1,
				labelOrigin:new google.maps.Point(17,11),
				path:'M26.837,9.837C26.837,17.765,17,19.89,17,34 c0-14.11-9.837-16.235-9.837-24.163C7.163,4.404,11.567,0,17,0C22.432,0,26.837,4.404,26.837,9.837z',
				scale:1,
				strokeColor:"#696969"
			});
			if ('label' in markeroptions)
				marker.setLabel({
					color:forecolor,
					fontSize:fontsize,
					text:markeroptions.label
				});
			if ('click' in markeroptions) google.maps.event.addListener(marker,'click',(e) => markeroptions.click(index));
			else
			{
				/* append balloons */
				if ('balloon' in markeroptions)
				{
					var balloon=new google.maps.InfoWindow({content:markeroptions.balloon,disableAutoPan:true});
					balloon.open(this.map,marker);
					google.maps.event.addListener(marker,'click',(e) => {
						if (!balloon.getMap()) balloon.open(this.map,marker);
					});
					this.balloons.push(balloon);
				}
			}
			this.markers.push(marker);
		};
		/* initialize markers */
		for (var i=0;i<this.markers.length;i++) this.markers[i].setMap(null);
		this.markers=[];
		/* initialize balloons */
		for (var i=0;i<this.balloons.length;i++) this.balloons[i].setMap(null);
		this.balloons=[];
		/* initialize renderer */
		this.directionsRenderer.setMap(null);
		switch (markers.length)
		{
			case 0:
				break;
			case 1:
				/* append markers */
				addmarker(markers[0],0);
				/* setup center position */
				this.map.setCenter(new google.maps.LatLng(markers[0].lat,markers[0].lng));
				if (callback) callback();
				break;
			default:
				if (addroute)
				{
					/* setup routes */
					var origin=null;
					var destination=null;
					var waypoints=[];
					var labels=[];
					for (var i=0;i<markers.length;i++)
					{
						switch (index)
						{
							case 0:
								origin=new google.maps.LatLng(markers[i].lat,markers[i].lng);
								break;
							case markers.length-1:
								destination=new google.maps.LatLng(markers[i].lat,markers[i].lng);
								break;
							default:
								waypoints.push({
									location:new google.maps.LatLng(markers[i].lat,markers[i].lng),
									stopover:true
								});
								break;
						}
						labels.push((markers[i].label.length!=0)?markers[i].label:'');
					}
					/* setup center position */
					this.map.setCenter(new google.maps.LatLng(markers[0].lat,markers[0].lng));
					/* display routes */
					this.directionsService.route({
						origin:origin,
						destination:destination,
						waypoints:waypoints,
						travelMode:google.maps.TravelMode.DRIVING
					},
					(result,status) => {
						if (status==google.maps.DirectionsStatus.OK)
						{
							/* append markers */
							for (var i=0;i<markers.length;i++) addmarker(markers[i],i);
							this.directionsRenderer.setDirections(result);
							this.directionsRenderer.setMap(this.map);
							if (callback) callback();
						}
					});
				}
				else
				{
					/* append markers */
					for (var i=0;i<markers.length;i++) addmarker(markers[i],i);
					/* setup center position */
					this.map.setCenter(new google.maps.LatLng(markers[0].lat,markers[0].lng));
					if (callback) callback();
				}
				break;
		}
	}
	/* search address */
	searchaddress(lat,lng,callback){
		this.geocoder.geocode({location:new google.maps.LatLng(lat,lng)},(results,status) => {
			switch (status)
			{
				case google.maps.GeocoderStatus.ZERO_RESULTS:
					break;
				case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
					tis.alert('リクエストが割り当て量を超えています');
					break;
				case google.maps.GeocoderStatus.REQUEST_DENIED:
					tis.alert('リクエストが拒否されました');
					break;
				case google.maps.GeocoderStatus.INVALID_REQUEST:
					tis.alert('クエリが不足しています');
					break;
				case 'OK':
					if (callback) callback(results[0].formatted_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}[ ]*/g,''));
					break;
			}
		});
	}
	/* search location */
	searchlocation(address,callback){
		this.geocoder.geocode({address:address,region:'jp'},(results,status) => {
			switch (status)
			{
				case google.maps.GeocoderStatus.ZERO_RESULTS:
					break;
				case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
					tis.alert('リクエストが割り当て量を超えています');
					break;
				case google.maps.GeocoderStatus.REQUEST_DENIED:
					tis.alert('リクエストが拒否されました');
					break;
				case google.maps.GeocoderStatus.INVALID_REQUEST:
					tis.alert('クエリが不足しています');
					break;
				case 'OK':
					if (callback) callback(results[0].geometry.location.lat(),results[0].geometry.location.lng());
					break;
			}
		});
	}
	/* watch location */
	watchlocation(continuous,callback){
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert('Internet Explorerでは正常に動作しません');
			this.watchaccuracy=Number.MAX_SAFE_INTEGER;
			this.watchstart=new Date();
			this.watchID=navigator.geolocation.watchPosition(
				(pos) => {
					if (continuous) callback(new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude));
					else
					{
						this.watchcurrent=new Date();
						if (this.watchaccuracy>pos.coords.accuracy) this.centerlocation=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
						if (pos.coords.accuracy<300 || this.watchcurrent.getTime()-this.watchstart.getTime()>10000)
						{
							this.unwatchlocation();
							callback(this.centerlocation);
						}
					}
				},
				(error) => {
					this.unwatchlocation();
					switch (error.code)
					{
						case 1:
							tis.alert('位置情報取得のアクセスが拒否されました<br>'+error.message);
							break;
						case 2:
							tis.alert('位置情報の取得に失敗しました<br>'+error.message);
							break;
					}
				},
				{
					enableHighAccuracy:true,
					maximumAge:0,
					timeout:10000
				}
			);
		}
		else tis.alert('お使いのブラウザでは位置情報が取得出来ません');
	}
	/* clear watch location */
	unwatchlocation(){
		if (navigator.geolocation) navigator.geolocation.clearWatch(this.watchID);
		this.watchID=null;
	}
};
class tispanelizer{
	/* constructor */
	constructor(){
		var div=tis.create('div');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		})
		.on('click',(e) => this.hide());
		this.container=div.clone().css({
			height:'100%',
			overflowX:'auto',
			overflowY:'hidden',
			padding:'1em 0.5em',
			textAlign:'center',
			verticalAlign:'middle',
			whiteSpace:'nowrap',
			width:'100%'
		});
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(this.container)
		);
	}
	/* show images */
	show(elements){
		var img=tis.create('img');
		/* clear images */
		this.container.empty();
		/* create images */
		elements.some((item,index) => {
			if (item.tagName.toLowerCase()=='img')
				if (item.src)
					this.container.append(
						img.clone().css({
							boxSizing:'border-box',
							display:'inline-block',
							margin:'0px 0.5em',
							maxHeight:'100%',
							maxWidth:'calc(100% - 2em)',
							position:'relative',
							verticalAlign:'middle'
						})
						.attr('src',item.src)
						.on('click',(e) => this.hide())
					);
		});
		/* create elements for adjusting the height */
		this.container.append(
			tis.create('div').css({
				boxSizing:'border-box',
				display:'inline-block',
				height:'100%',
				verticalAlign:'middle',
				width:'0px'
			})
		);
		/* show */
		this.cover.css({display:'block'});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tispopupwindow{
	/* constructor */
	constructor(innerElements,maxwidth,maxheight,callback){
		var div=tis.create('div');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999996'
		});
		this.container=div.clone().css({
			backgroundColor:'#ffffff',
			borderRadius:'0.5em',
			bottom:'0',
			boxShadow:'0px 0px 3px rgba(0,0,0,0.35)',
			height:'calc(100% - 2em)',
			left:'0',
			margin:'auto',
			padding:'3em 0px 0.5em 0px',
			position:'absolute',
			right:'0',
			top:'0',
			width:'calc(100% - 2em)'
		});
		if (tis.isnumeric(maxwidth)) this.container.css({maxWidth:maxwidth+'px'});
		if (tis.isnumeric(maxheight)) this.container.css({maxHeight:maxheight+'px'});
		this.contents=div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'0px 0.5em',
			textAlign:'center',
			width:'100%'
		});
		this.close=tis.create('img')
		.css({
			backgroundColor:'transparent',
			border:'none',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'block',
			height:'2em',
			margin:'0px',
			position:'absolute',
			right:'0.5em',
			top:'0.5em',
			width:'2em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC')
		.on('click',(e) => {
			this.hide();
			if (callback) callback();
		});
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(
					this.contents
					.append(innerElements.css({margin:'0px auto'}))
				)
				.append(this.close)
			)
		);
	}
	/* show */
	show(){
		this.cover.css({display:'block'});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
class tisloader{
	/* constructor */
	constructor(){
		var span=tis.create('span');
		var keyframes={};
		var vendors=['-webkit-',''];
		/* initialize valiable */
		keyframes['0%']={
			'transform':'translateY(0);'
		};
		keyframes['25%']={
			'transform':'translateY(0);'
		};
		keyframes['50%']={
			'transform':'translateY(-0.5em);'
		};
		keyframes['100%']={
			'transform':'translateY(0);'
		};
		span.css({
			color:'#ffffff',
			display:'inline-block',
			lineHeight:'2em',
			padding:'0px 1px',
			verticalAlign:'top',
			WebkitAnimationName:'loading',
			WebkitAnimationDuration:'1s',
			WebkitAnimationTimingFunction:'ease-out',
			WebkitAnimationIterationCount:'infinite',
			animationName:'loading',
			animationDuration:'1s',
			animationTimingFunction:'ease-out',
			animationIterationCount:'infinite'
		});
		/* setup properties */
		this.cover=tis.create('div').css({
			backgroundColor:'rgba(0,0,0,0.5)',
			boxSizing:'border-box',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999998'
		});
		this.container=tis.create('p').css({
			bottom:'0',
			fontSize:'0.8em',
			height:'2em',
			left:'0',
			margin:'auto',
			maxHeight:'100%',
			maxWidth:'100%',
			overflow:'hidden',
			padding:'0px',
			position:'absolute',
			right:'0',
			textAlign:'center',
			top:'0',
			width:'100%'
		});
		/* append styles */
		tis.elm('head').append(
			tis.create('style')
			.attr('media','screen')
			.attr('text','text/css')
			.text(
				((vendors,keyframes) => {
					var res='';
					for (var i=0;i<vendors.length;i++)
						res+='@'+vendors[i]+'keyframes loading'+JSON.stringify(keyframes).replace(/:{/g,'{').replace(/[,"]/g,'')+' '
					return res.replace(/[ ]+$/g,'')
				})(vendors,keyframes)
			)
		);
		/* append elements */
		tis.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(
					tis.create('span').css({
						color:'#ffffff',
						display:'inline-block',
						lineHeight:'2em',
						paddingRight:'0.25em',
						verticalAlign:'top'
					})
					.html('Please wait a moment')
				)
				.append(span.clone().css({animationDelay:'0s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.1s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.2s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.3s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.4s'}).html('.'))
			)
		);
	}
	/* show */
	show(){
		this.cover.css({display:'block'});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
var tis=new tislibrary();
/*
DOM extention
*/
HTMLDocument.prototype.off=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.removeEventListener(types[i],listener);
	return this;
}
HTMLDocument.prototype.on=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.addEventListener(types[i],listener);
	return this;
}
HTMLElement.prototype.addclass=function(className){
	this.classList.add(className);
	return this;
}
HTMLElement.prototype.append=function(element){
	this.appendChild(element);
	return this;
}
HTMLElement.prototype.attr=function(name,value){
	if (typeof value!=='undefined')
	{
		this.setAttribute(name,value);
		return this;
	}
	else return this.getAttribute(name);
}
HTMLElement.prototype.clone=function(){
	return this.cloneNode(true);
}
HTMLElement.prototype.closest=function(selectors){
	var search=(element) => {
		if (!(element.parentNode instanceof HTMLDocument))
		{
			if (element.parentNode.matches(selectors)) return element.parentNode;
			else return search(element.parentNode);
		}
		else return null;
	};
	return search(this);
}
HTMLElement.prototype.css=function(properties){
	if (typeof properties!=='string')
	{
		for (var key in properties) this.style[key]=properties[key];
		return this;
	}
	else return (this.currentStyle)?this.currentStyle[properties]:document.defaultView.getComputedStyle(this,null).getPropertyValue(properties);
}
HTMLElement.prototype.elm=function(selectors){
	return this.querySelector(selectors);
}
HTMLElement.prototype.elms=function(selectors){
	return Array.from(this.querySelectorAll(selectors));
}
HTMLElement.prototype.empty=function(){
	this.innerHTML='';
	return this;
}
HTMLElement.prototype.hasclass=function(className){
	return this.classList.contains(className);
}
HTMLElement.prototype.hide=function(){
	return this.css({display:'none'});
}
HTMLElement.prototype.html=function(value){
	if (typeof value!=='undefined')
	{
		this.innerHTML=value;
		return this;
	}
	else return this.innerHTML;
}
HTMLElement.prototype.innerheight=function(){
	var paddingTop=this.css('padding-top');
	var paddingBottom=this.css('padding-bottom');
	if (!paddingTop) paddingTop='0';
	if (!paddingBottom) paddingBottom='0';
	return this.clientHeight-parseFloat(paddingTop)-parseFloat(paddingBottom);
}
HTMLElement.prototype.innerwidth=function(){
	var paddingLeft=this.css('padding-left');
	var paddingRight=this.css('padding-right');
	if (!paddingLeft) paddingLeft='0';
	if (!paddingRight) paddingRight='0';
	return this.clientWidth-parseFloat(paddingLeft)-parseFloat(paddingRight);
}
HTMLElement.prototype.initialize=function(){
	this.alert=tis.create('div').css({
		display:'none',
		position:'fixed',
		margin:'-0.5em 0px 0px 0px',
		transition:'none',
		zIndex:tis.window.alert.cover.style.zIndex-1
	})
	.append(
		tis.create('img').css({
			display:'block',
			height:'0.75em',
			margin:'0px 0px 0px 1.5em',
			position:'relative',
			width:'0.75em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkVGNzA3QTE1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkVGNzA3QTI1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRUY3MDc5RjVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRUY3MDdBMDVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkBlNTAAAADNSURBVHja7NHBCcJAFATQZNBcYwmSmycPlpI2bCVgAVqAVmAFHmxqncAKQVyz+/N/grADc0iyy0Be6ZwrlgiKhZKH83Ae/v/h1X23l9499vfZk2hYOHpgO7ZkH+xzjl9dsze2Ytfsld3MMXxhm8Hzlj1bD/eu7Zf3rf9mMvx2DaXzZ1SHh66hVP5MrTn86RpK48+qDIdcQ4nyxkRXsTcmuoq9oeAq8oaSa7I3FF2TvKHomuQNZddobxi4RnnDyHXUG0auo94wdP3p/RJgAMw4In5GE/6/AAAAAElFTkSuQmCC')
	)
	.append(
		tis.create('span').css({
			backgroundColor:'#b7282e',
			borderRadius:'0.5em',
			color:'#ffffff',
			display:'block',
			lineHeight:'2em',
			margin:'0px',
			padding:'0px 0.5em',
			position:'relative'
		})
	);
	var chase=(message) => {
		var rect=this.getBoundingClientRect();
		this.alert.css({
			left:rect.left.toString()+'px',
			top:rect.bottom.toString()+'px'
		});
		if (message) this.alert.elm('span').html(message);
		return this.alert;
	};
	var transition=(e) => {
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var elements=tis.elms('button,input,select,textarea').filter((element) => {
				var exists=0;
				if (element.visible())
				{
					if (element.hasAttribute('tabindex'))
						if (element.attr('tabindex')=='-1') exists++;
					if (element.tagName.toLowerCase()=='input')
						if (element.type.toLowerCase().match(/(color|file)/g)) exists++;
				}
				else exists++;
				return exists==0;
			});
			var total=elements.length;
			var index=elements.indexOf(e.currentTarget)+(e.shiftKey?-1:1);
			elements[(index<0)?total-1:((index>total-1)?0:index)].focus();
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
	};
	/* setup focus transition */
	switch (this.tagName.toLowerCase())
	{
		case 'input':
			switch (this.type.toLowerCase())
			{
				case 'button':
				case 'color':
				case 'file':
				case 'image':
				case 'reset':
					break;
				default:
					this
					.on('keydown',transition)
					.on('focus',(e) => this.beforevalue=e.currentTarget.val())
					.on('blur',(e) => {
						if (e.currentTarget.hasAttribute('data-padding'))
						{
							var param=e.currentTarget.attr('data-padding').split(':');
							var value=e.currentTarget.val();
							if (param.length==3)
							{
								if (value===undefined || value===null) value='';
								if (param[2]=='L') e.currentTarget.val(value.toString().lpad(param[0],param[1]));
								else  e.currentTarget.val(value.toString().rpad(param[0],param[1]));
							}
						}
					});
					break;
			}
			break;
		case 'select':
			this
			.on('keydown',transition)
			.on('focus',(e) => this.beforevalue=e.currentTarget.val());
			break;
	}
	/* setup required */
	if (this.hasAttribute('required'))
	{
		var placeholder=this.attr('placeholder');
		if (placeholder) placeholder=placeholder.replace('*必須項目','')
		this.attr('placeholder','*必須項目'+((placeholder)?' '+placeholder:''));
	}
	/* setup validation */
	if (this.hasAttribute('data-type'))
		switch (this.attr('data-type'))
		{
			case 'alphabet':
				this.attr('pattern','^[A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~]+$');
				break;
			case 'alphanum':
				this.attr('pattern','^[0-9A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~]+$');
				break;
			case 'color':
				this.attr('pattern','^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$');
				break;
			case 'date':
				this.attr('pattern','^[1-9][0-9]{3}[\\-.\\/]+([1-9]{1}|0[1-9]{1}|1[0-2]{1})[\\-.\\/]+([1-9]{1}|[0-2]{1}[0-9]{1}|3[01]{1})$')
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^0-9]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^0-9]+/g,'');
					if (value.length==8) e.currentTarget.val(value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2));
				});
				break;
			case 'datetime':
				this.attr('pattern','^[1-9][0-9]{3}[\\-.\\/]+([1-9]{1}|0[1-9]{1}|1[0-2]{1})[\\-.\\/]+([1-9]{1}|[0-2]{1}[0-9]{1}|3[01]{1}) [0-9]{1,2}:[0-9]{1,2}$');
				break;
			case 'mail':
				this.attr('pattern','^[0-9A-Za-z]+[0-9A-Za-z._-]*@[0-9A-Za-z]+[0-9A-Za-z._-]*\\.[a-z]{2,4}$');
				break;
			case 'number':
				this.attr('pattern','^[0-9,\\-.]+$')
				.css({textAlign:'right'})
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^-0-9.]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^-0-9.]+/g,'');
					if (value) e.currentTarget.val(Number(value).comma(this.attr('data-digit')));
				});
				break;
			case 'postalcode':
				this.attr('pattern','^[0-9]{3}-?[0-9]{4}$')
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^0-9]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^0-9]+/g,'');
					if (value.length==7) e.currentTarget.val(value.substr(0,3)+'-'+value.substr(3,4));
				});
				break;
			case 'tel':
				this.attr('pattern','^0[0-9]{1,3}-?[0-9]{2,4}-?[0-9]{3,4}$');
				break;
			case 'time':
				this.attr('pattern','^[0-9]{1,2}:[0-9]{1,2}$');
				break;
			case 'url':
				this.attr('pattern','^https?:\\/\\/[0-9A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~]+$');
				break;
		}
	/* append elements */
	tis.elm('body').append(chase());
	/* resize scroll event */
	window.on('resize,scroll',(e) => chase());
	/* validation event */
	return this.on('invalid',(e) => {
		/* validate required */
		if (e.currentTarget.validity.valueMissing) chase('必須項目です').show();
		/* validate pattern */
		if (e.currentTarget.validity.patternMismatch) chase('入力内容を確認して下さい').show();
		/* validate type */
		if (e.currentTarget.validity.typeMismatch) chase('入力内容を確認して下さい').show();
	}).on('focus',(e) => this.alert.hide());
}
HTMLElement.prototype.isempty=function(){
	var exists=false;
	this.elms('input,select,textarea').some((item,index) => {
		switch (item.tagName.toLowerCase())
		{
			case 'input':
				switch (item.type.toLowerCase())
				{
					case 'button':
					case 'image':
					case 'radio':
					case 'reset':
						break;
					case 'checkbox':
						if (!exists) exists=item.checked;
						break;
					case 'color':
						if (!exists) exists=(item.val()!='#000000');
						break;
					case 'range':
						var max=(item.max)?parseFloat(item.max):100;
						var min=(item.min)?parseFloat(item.min):0;
						if (!exists) exists=(item.val()!=(max-min)/2);
						break;
					default:
						if (!exists) exists=(item.val());
						break;
				}
				break;
			case 'select':
				if (!exists) exists=(this.selectedIndex);
				break;
			default:
				if (!exists) exists=(item.val());
				break;
		}
	});
	return !exists;
}
HTMLElement.prototype.off=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.removeEventListener(types[i],listener);
	return this;
}
HTMLElement.prototype.on=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.addEventListener(types[i],listener);
	return this;
}
HTMLElement.prototype.outerheight=function(includemargin){
	if (includemargin)
	{
		var marginTop=this.css('margin-top');
		var marginBottom=this.css('margin-bottom');
		if (!marginTop) marginTop='0';
		if (!marginBottom) marginBottom='0';
		return this.offsetHeight+parseFloat(marginTop)+parseFloat(marginBottom);
	}
	return this.offsetHeight;
}
HTMLElement.prototype.outerwidth=function(includemargin){
	if (includemargin)
	{
		var marginLeft=this.css('margin-left');
		var marginRight=this.css('margin-right');
		if (!marginLeft) marginLeft='0';
		if (!marginRight) marginRight='0';
		return this.offsetWidth+parseFloat(marginLeft)+parseFloat(marginRight);
	}
	return this.offsetWidth;
}
HTMLElement.prototype.pager=function(offset,limit,records,total,callback){
	var error=false;
	var img=tis.create('img').css({
		backgroundColor:'transparent',
		border:'none',
		boxSizing:'border-box',
		cursor:'pointer',
		display:'inline-block',
		height:'2em',
		position:'relative',
		width:'2em'
	});
	var span=tis.create('span').css({
		display:'inline-block',
		lineHeight:'2em',
		padding:'0px 0.25em',
		verticalAlign:'top'
	});
	if (!tis.isnumeric(offset)) error=true;
	if (!tis.isnumeric(limit)) error=true;
	if (!tis.isnumeric(records)) error=true;
	if (!tis.isnumeric(total)) error=true;
	if (!error)
	{
		this.empty();
		if (parseInt(offset)>0)
		{
			this.append(
				img.clone()
				.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC')
				.on('click',(e) => {
					if (callback) callback(parseInt(offset)-parseInt(limit));
				})
			);
		}
		this.append(span.clone().html((parseInt(offset)+1).comma()));
		this.append(span.clone().html('-'));
		this.append(span.clone().html((parseInt(offset)+parseInt(records)).comma()));
		this.append(span.clone().html('in'));
		this.append(span.clone().html(parseInt(total).comma()));
		if (parseInt(offset)+parseInt(records)<total)
		{
			this.append(
				img.clone()
				.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC')
				.on('click',(e) => {
					if (callback) callback(parseInt(offset)+parseInt(limit));
				})
			);
		}
	}
	else tis.alert('ページャーの指定に誤りがあります');
	return this;
}
HTMLElement.prototype.popup=function(maxwidth,maxheight,callback){
	return new tispopupwindow(this,maxwidth,maxheight,callback);
}
HTMLElement.prototype.removeclass=function(className){
	this.classList.remove(className);
	return this;
}
HTMLElement.prototype.show=function(){
	return this.css({display:'block'});
}
HTMLElement.prototype.spread=function(addcallback,delcallback,autoadd=true){
	/* setup properties */
	this.container=this.elm('tbody');
	this.tr=this.container.elms('tr');
	this.template=this.tr.first().clone();
	this.addrow=(putcallback=true) => {
		var row=this.template.clone();
		this.container.append(row);
		/* setup properties */
		this.tr=this.container.elms('tr');
		/* setup listener */
		var listener=(e) => {
			if (autoadd)
				if (e.currentTarget.value)
					if (!this.tr.last().isempty()) this.addrow();
		};
		row.elms('input,select,textarea').some((item,index) => {
			switch (item.initialize().tagName.toLowerCase())
			{
				case 'input':
					switch (item.type.toLowerCase())
					{
						case 'button':
						case 'image':
						case 'radio':
						case 'reset':
							break;
						case 'checkbox':
						case 'color':
						case 'date':
						case 'datetime-local':
						case 'file':
						case 'month':
						case 'range':
						case 'time':
						case 'week':
							item.on('change',listener);
							break;
						case 'number':
							item.on('mouseup,keyup',listener);
							break;
						default:
							item.on('keyup',listener);
							break;
					}
					break;
				case 'select':
					item.on('change',listener);
					break;
				case 'textarea':
					item.on('keyup',listener);
					break;
			}
		});
		if (putcallback)
			if (addcallback) addcallback(row,this.tr.length);
		return row;
	};
	this.delrow=(row) => {
		row.elms('input,select,textarea').some((item,index) => {
			if (item.alert) tis.elm('body').removeChild(item.alert);
		});
		this.container.removeChild(row);
		/* setup properties */
		this.tr=this.container.elms('tr');
		if (autoadd)
		{
			if (this.tr.length==0) this.addrow();
			else
			{
				if (!this.tr.last().isempty()) this.addrow();
			}
		}
		if (delcallback) delcallback(this);
	};
	this.insertrow=(row) => {
		var add=this.addrow(false);
		this.container.insertBefore(add,row.nextSibling);
		/* setup properties */
		this.tr=this.container.elms('tr');
		if (addcallback) addcallback(add,this.tr.indexOf(add)+1);
		return add;
	};
	this.clearrows=() => {
		this.tr.some((item,index) => {
			this.container.removeChild(item);
		});
		/* setup properties */
		this.tr=[];
	};
	/* setup rows */
	this.clearrows();
	if (autoadd) this.addrow();
	return this;
}
HTMLElement.prototype.text=function(value){
	if (typeof value!=='undefined')
	{
		this.textContent=value;
		return this;
	}
	else
	{
		var value=this.textContent;
		if (value)
			if (this.hasAttribute('data-type'))
				switch (this.attr('data-type'))
				{
					case 'date':
						if (value.length==8)
							if (tis.isnumeric(value))
								value=value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2);
						break;
					case 'number':
						value=value.replace(/,/g,'');
						break;
				}
		return value;
	}
}
HTMLElement.prototype.val=function(value){
	if (typeof value!=='undefined')
	{
		this.value=value;
		return this;
	}
	else
	{
		var value=this.value;
		if (value)
			if (this.hasAttribute('data-type'))
				switch (this.attr('data-type'))
				{
					case 'date':
						if (value.length==8)
							if (tis.isnumeric(value))
								value=value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2);
						break;
					case 'number':
						value=value.replace(/,/g,'');
						break;
				}
		return value;
	}
}
HTMLElement.prototype.visible=function(){
	return !(this.offsetWidth==0 && this.offsetHeight==0);
}
HTMLImageElement.prototype.assignfile=function(file){
	var url=window.URL || window.webkitURL;
	return this.attr('src',url.createObjectURL(file));
}
HTMLSelectElement.prototype.assignoption=function(records,display,value){
	for (var i=0;i<records.length;i++)
	{
		var record=records[i];
		this.append(
			tis.create('option')
			.attr('value',record[value])
			.html(record[display])
		);
	}
}
HTMLSelectElement.prototype.selectedtext=function(){
	if (this.options.length!=0)	return this.options[this.selectedIndex].textContent;
	else return '';
}
Window.prototype.off=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.removeEventListener(types[i],listener);
	return this;
}
Window.prototype.on=function(type,listener){
	var types=type.split(',');
	for (var i=0;i<types.length;i++) this.addEventListener(types[i],listener);
	return this;
}
/*
Array extention
*/
Array.prototype.first=function(){
	return this[0];
}
Array.prototype.last=function(){
	return this[this.length-1];
}
/*
Date extention
*/
Date.prototype.calc=function(pattern){
	var year=this.getFullYear();
	var month=this.getMonth()+1;
	var day=this.getDate();
	var hour=this.getHours();
	var minute=this.getMinutes();
	var second=this.getSeconds();
	//first day of year
	if (pattern.match(/^first-of-year$/g)) {month=1;day=1};
	//first day of month
	if (pattern.match(/^first-of-month$/g)) day=1;
	//add years
	if (pattern.match(/^-?[0-9]+ year$/g)) year+=parseInt(pattern.match(/^-?[0-9]+/g));
	//add months
	if (pattern.match(/^-?[0-9]+ month$/g))
	{
		month+=parseInt(pattern.match(/^-?[0-9]+/g));
		//check of next year
		while (month<1) {year--;month+=12;}
		while (month>12) {year++;month-=12;}
		//check of next month
		var check=new Date(year,(month-1),day);
		if (check.getMonth()+1!=month)
		{
			check=new Date(year,month,1);
			check.setDate(0);
			day=check.getDate();
		}
	}
	//add day
	if (pattern.match(/^-?[0-9]+ day$/g)) day+=parseInt(pattern.match(/^-?[0-9]+/g));
	//add hour
	if (pattern.match(/^-?[0-9]+ hour/g)) hour+=parseInt(pattern.match(/^-?[0-9]+/g));
	//add minute
	if (pattern.match(/^-?[0-9]+ minute/g)) minute+=parseInt(pattern.match(/^-?[0-9]+/g));
	//add second
	if (pattern.match(/^-?[0-9]+ second/g)) second+=parseInt(pattern.match(/^-?[0-9]+/g));
	return new Date(year,(month-1),day,hour,minute,second);
}
Date.prototype.format=function(pattern){
	var year=this.getFullYear();
	var month=('0'+(this.getMonth()+1)).slice(-2);
	var day=('0'+this.getDate()).slice(-2);
	var hour=('0'+this.getHours()).slice(-2);
	var minute=('0'+this.getMinutes()).slice(-2);
	var second=('0'+this.getSeconds()).slice(-2);
	var symbol=pattern.match(/(-|\/)/g);
	//year
	if (pattern.match(/^Y$/g)) return year;
	//month
	if (pattern.match(/^m$/g)) return month;
	//day
	if (pattern.match(/^d$/g)) return day;
	//hour
	if (pattern.match(/^H$/g)) return hour;
	//minute
	if (pattern.match(/^i$/g)) return minute;
	//second
	if (pattern.match(/^s$/g)) return second;
	//year-month
	if (pattern.match(/^Y(-|\/){1}m$/g)) return year+symbol[0]+month;
	//year-month-day
	if (pattern.match(/^Y(-|\/){1}m(-|\/){1}d$/g)) return year+symbol[0]+month+symbol[0]+day;
	//year-month-day hour
	if (pattern.match(/^Y(-|\/){1}m(-|\/){1}d H$/g)) return year+symbol[0]+month+symbol[0]+day+' '+hour;
	//year-month-day hour:minute
	if (pattern.match(/^Y(-|\/){1}m(-|\/){1}d H:i$/g)) return year+symbol[0]+month+symbol[0]+day+' '+hour+':'+minute;
	//year-month-day hour:minute:second
	if (pattern.match(/^Y(-|\/){1}m(-|\/){1}d H:i:s$/g)) return year+symbol[0]+month+symbol[0]+day+' '+hour+':'+minute+':'+second;
	//month-day
	if (pattern.match(/^m(-|\/){1}d$/g)) return month+symbol[0]+day;
	//month-day hour
	if (pattern.match(/^m(-|\/){1}d H$/g)) return month+symbol[0]+day+' '+hour;
	//month-day hour:minute
	if (pattern.match(/^m(-|\/){1}d H:i$/g)) return month+symbol[0]+day+' '+hour+':'+minute;
	//month-day hour:minute:second
	if (pattern.match(/^m(-|\/){1}d H:i:s$/g)) return month+symbol[0]+day+' '+hour+':'+minute+':'+second;
	//day hour
	if (pattern.match(/^d H$/g)) return day+' '+hour;
	//day hour:minute
	if (pattern.match(/^d H:i$/g)) return day+' '+hour+':'+minute;
	//day hour:minute:second
	if (pattern.match(/^d H:i:s$/g)) return day+' '+hour+':'+minute+':'+second;
	//hour:minute
	if (pattern.match(/^H:i$/g)) return hour+':'+minute;
	//hour:minute:second
	if (pattern.match(/^H:i:s$/g)) return hour+':'+minute+':'+second;
	//minute:second
	if (pattern.match(/^i:s$/g)) return minute+':'+second;
	return '';
}
/*
Number extention
*/
Number.prototype.comma=function(digit){
	var res=String(this);
	if (digit) res=this.toFixed(parseInt(digit));
	return res.replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,');
}
/*
String extention
*/
String.prototype.bytelength=function(){
	var res=0;
	for (var i=0;i<this.length;i++)
	{
		var char=this.charCodeAt(i);
		if ((char>=0x0 && char<0x81) || (char===0xf8f0) || (char>=0xff61 && char<0xffa0) || (char>=0xf8f1 && char<0xf8f4)) res+=1;
		else res+=2;
	}
	return res;
}
String.prototype.lpad=function(pattern,length){
	var padding='';
	for (var i=0;i<length;i++) padding+=pattern;
	return (padding+this).slice(length*-1);
}
String.prototype.rpad=function(pattern,length){
	var padding='';
	for (var i=0;i<length;i++) padding+=pattern;
	return (this+padding).slice(0,length);
}
