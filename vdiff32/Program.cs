using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace vdiff32
{
   internal class Program
   {
      private const string merge = "Merge.exe";

      private static void Main(string[] args)
      {
         var psi = new ProcessStartInfo { FileName = merge, Arguments = String.Join(" ", args) };
         Process.Start(psi);
      }
   }
}