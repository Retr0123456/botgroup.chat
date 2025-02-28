//这里配置群聊的信息
export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export const groups: Group[] = [
  {
    id: 'group1',
    name: '满眼都是💖竹',
    description: '满眼都是💖竹',
    members: [ 'ai10']
  }
  ,
  {
    id: 'group2',
    name: '完蛋！我被朴洙包围了',
    description: '完蛋！我被朴洙包围了',
    members: ['ai1', 'ai2', 'ai3', 'ai8', 'ai9', 'ai10']
  }
  ,
  {
    id: 'group3',
    name: '完蛋！我被朴洙包围了',
    description: '完蛋！我被朴洙包围了',
    members: ['ai1', 'ai2', 'ai3', 'ai8', 'ai9', 'ai10']
  }
  ,
  // {
  //   id: 'group2',
  //   name: '王海菊交流群',
  //   description: '王海菊交流群',
  //   members: ['ai4', 'ai5', 'ai6', 'ai7']
  // }
];
