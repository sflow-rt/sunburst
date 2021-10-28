// author: InMon Corp.
// version: 0.4
// date: 10/28/2021
// description: Sunburst display of flows
// copyright: Copyright (c) 2021 InMon Corp. ALL RIGHTS RESERVED

var aggMode  = getSystemProperty('sunburst.aggMode')  || 'sum';
var maxFlows = getSystemProperty('sunburst.maxFlows') || 100;
var minValue = getSystemProperty('sunburst.minValue') || 1;
var agents   = getSystemProperty('sunburst.agents')   || 'ALL';
var t        = getSystemProperty('sunburst.t')        || 5;
var n        = getSystemProperty('sunburst.n')        || 20;
var value    = getSystemProperty('sunburst.value')    || 'frames';

setFlow('sunburst-stack', {
  keys:[
    'stack',
    'null:ethernetprotocol:0',
    'null:ipprotocol:0',
    'null:ip6nexthdr:0',
    'null:tcpsourceport:0',
    'null:tcpdestinationport:0',
    'null:udpsourceport:0',
    'null:udpdestinationport:0'
  ],
  value:value,
  t:t,
  n:n
});

function getData() {
  var tree = {depth:0,value:0,label:'Protocols'};
  var top = activeFlows(agents,'sunburst-stack',maxFlows,minValue,aggMode);
  top.forEach(function(el) {
    let node = tree;
    let val = el.value;
    let [stack,ethernetprotocol,ipprotocol,ip6nexthdr,tcpsourceport,tcpdestinationport,udpsourceport,udpdestinationport] = el.key.split(',');
    let protos = stack.split('.');
    tree.value += val;
    if(protos.length > tree.depth) tree.depth = protos.length;
    protos.forEach(function(proto,i) {
      if(!node.children) node.children = {};
      let child = node.children[proto];
      if(!child) {
        child = {value:val};
        node.children[proto] = child;
      } else {
        child.value += val;
      }
      child.filter = 'prefix:stack:.:'+(i+1)+'='+protos.slice(0,i+1).join('.');
      child.id=protos.slice(0,i+1).join('.');
      node = child;
    });
    let port = 0;
    let filter;
    switch(protos[protos.length - 1]) {
      case 'eth':
        port = parseInt(ethernetprotocol);
        filter = 'ethernetprotocol='+port;
        break;
      case 'ip':
        port = parseInt(ipprotocol);
        filter = 'ipprotocol='+port;
        break;
      case 'ip6':
        port = parseInt(ip6nexthdr);
        filter = 'ip6nexthdr='+port;
        break;
      case 'tcp':
        port = Math.min(parseInt(tcpsourceport),parseInt(tcpdestinationport));
        filter = '(tcpsourceport='+port+'|tcpdestinationport='+port+')';
        break;
      case 'udp':
        port = Math.min(parseInt(udpsourceport),parseInt(udpdestinationport));
        filter = '(udpsourceport='+port+'|udpdestinationport='+port+')';
        break;
    }
    if(port > 0) {
      if(protos.length + 1 > tree.depth) tree.depth = protos.length + 1;
      let proto = port.toString();
      if(!node.children) node.children = {};
      let child = node.children[proto];
      if(!child) {
        child = {value:val};
        node.children[proto] = child;
      } else {
        child.value += val;
      }
      child.filter=node.filter + '&' + filter;
      child.id=node.id + '.' + proto;
    }
  });
  return tree;
};

setHttpHandler(function(req) {
  return getData();
});

