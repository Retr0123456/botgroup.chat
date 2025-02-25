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
    name: '完蛋！我被朴洙包围了',
    description: '完蛋！我被朴洙包围了',
    members: ['ai1', 'ai2', 'ai3', 'ai8', 'ai9', 'ai4']
  }
  ,
  {
    id: 'group2',
    name: '完蛋！我被朴洙包围了',
    description: '完蛋！我被朴洙包围了',
    members: ['ai1', 'ai2', 'ai3', 'ai8', 'ai9', 'ai4']
  }
  ,
  // {
  //   id: 'group2',
  //   name: '王海菊交流群',
  //   description: '王海菊交流群',
  //   members: ['ai4', 'ai5', 'ai6', 'ai7']
  // }
];
